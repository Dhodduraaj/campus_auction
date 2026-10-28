package com.campusauction.auction;

import com.campusauction.audit.AuditService;
import com.campusauction.bid.Bid;
import com.campusauction.bid.BidRepository;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.NotificationType;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingRepository;
import com.campusauction.listing.dto.ListingCardDto;
import com.campusauction.listing.dto.ListingDetailDto;
import com.campusauction.notification.NotificationService;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuctionClosingScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuctionClosingScheduler.class);

    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final AuctionOutcomeRepository auctionOutcomeRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    // Run every 5 seconds to promptly close expired auctions
    @Scheduled(fixedDelay = 5000)
    public void closeExpiredAuctions() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Listing> expiredOpenListings = listingRepository.findByStatusAndClosingAtLessThanEqual(ListingStatus.OPEN, now);

        for (Listing listing : expiredOpenListings) {
            try {
                transactionTemplate.executeWithoutResult(status -> processAuctionClosing(listing.getId()));
            } catch (Exception ex) {
                log.error("Error closing auction {}: {}", listing.getId(), ex.getMessage());
            }
        }
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void processAuctionClosing(Long listingId) {
        // Concurrency protection: acquire lock on the auction row
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId).orElse(null);
        if (listing == null || listing.getStatus() != ListingStatus.OPEN) {
            return; // Already closed or does not exist (idempotent)
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (!listing.isExpired(now)) {
            return; // Not yet expired
        }

        // Check if outcome already exists to prevent duplicate processing
        if (auctionOutcomeRepository.existsByListingId(listing.getId())) {
            return;
        }

        listing.setClosedAt(now);

        // Check for accepted bids
        Optional<Bid> winningBidOpt = bidRepository.findFirstByListingIdOrderByAmountDescCreatedAtAsc(listing.getId());

        if (winningBidOpt.isEmpty() || listing.getBidCount() == 0) {
            // UNSOLD case
            listing.setStatus(ListingStatus.UNSOLD);
            listingRepository.save(listing);

            AuctionOutcome outcome = AuctionOutcome.builder()
                    .listing(listing)
                    .finalStatus(ListingStatus.UNSOLD)
                    .completedAt(now)
                    .build();
            auctionOutcomeRepository.save(outcome);

            notificationService.createNotification(
                    listing.getSeller(),
                    NotificationType.AUCTION_CLOSED,
                    "Auction Ended: Unsold",
                    "Your auction for '" + listing.getTitle() + "' has ended with no bids. You may edit or relist it anytime.",
                    listing
            );

            auditService.recordEvent(listing, null, "AUCTION_CLOSED_UNSOLD", "Closed with no accepted bids.");
            log.info("Auction {} closed as UNSOLD.", listing.getId());
        } else {
            // AWAITING_SELLER_APPROVAL case
            Bid winningBid = winningBidOpt.get();
            User provisionalWinner = winningBid.getBidder();

            listing.setStatus(ListingStatus.AWAITING_SELLER_APPROVAL);
            listing.setLeadingBidder(provisionalWinner);
            listing.setCurrentHighestBid(winningBid.getAmount());
            listingRepository.save(listing);

            AuctionOutcome outcome = AuctionOutcome.builder()
                    .listing(listing)
                    .provisionalWinner(provisionalWinner)
                    .winningBid(winningBid)
                    .finalStatus(ListingStatus.AWAITING_SELLER_APPROVAL)
                    .build();
            auctionOutcomeRepository.save(outcome);

            // Notify Seller
            notificationService.createNotification(
                    listing.getSeller(),
                    NotificationType.AUCTION_CLOSED,
                    "Auction Ended: Highest Bid ₹" + winningBid.getAmount(),
                    "Bidding has closed for '" + listing.getTitle() + "'. Winning price is ₹" + winningBid.getAmount() + ". Please review and approve or reject the sale.",
                    listing
            );

            // Notify Provisional Winner
            notificationService.createNotification(
                    provisionalWinner,
                    NotificationType.PROVISIONAL_WINNER,
                    "You won the auction!",
                    "Your bid of ₹" + winningBid.getAmount() + " is the highest valid bid. The seller must approve the sale before the item is reserved.",
                    listing
            );

            auditService.recordEvent(listing, provisionalWinner, "AUCTION_CLOSED_PENDING_APPROVAL", "Winning bid: ₹" + winningBid.getAmount());
            log.info("Auction {} closed with winning bid ₹{}. Awaiting seller approval.", listing.getId(), winningBid.getAmount());
        }

        // Real-time broadcast
        try {
            messagingTemplate.convertAndSend("/topic/auctions/" + listingId, ListingDetailDto.fromEntity(listing, null));
            messagingTemplate.convertAndSend("/topic/auctions", ListingCardDto.fromEntity(listing));
        } catch (Exception ignored) {}
    }
}
