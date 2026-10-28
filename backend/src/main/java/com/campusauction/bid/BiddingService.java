package com.campusauction.bid;

import com.campusauction.audit.AuditService;
import com.campusauction.bid.dto.BidDto;
import com.campusauction.bid.dto.PlaceBidRequest;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.NotificationType;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.InvalidBidException;
import com.campusauction.common.exception.ResourceNotFoundException;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BiddingService {

    private static final Logger log = LoggerFactory.getLogger(BiddingService.class);

    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BidDto placeBid(Long listingId, PlaceBidRequest request, User bidder) {
        BigDecimal bidAmount = request.getAmount();

        if (bidAmount == null || bidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidBidException("Bid amount must be positive.");
        }

        // PESSIMISTIC WRITE LOCK on the listing row: Prevents concurrent race conditions
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found with id: " + listingId));

        // 1. Role enforcement: Only Junior accounts can place bids
        if (bidder.getRole() != Role.JUNIOR && bidder.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only Junior accounts can place bids.");
        }

        // 2. Seller cannot bid on own item
        if (listing.getSeller().getId().equals(bidder.getId())) {
            throw new ForbiddenException("Sellers are strictly prohibited from bidding on their own listings.");
        }

        // 3. Check auction status
        if (listing.getStatus() != ListingStatus.OPEN) {
            throw new InvalidBidException("Auction is not open for bidding. Current status: " + listing.getStatus());
        }

        // 4. Authoritative server timestamp check against closing time
        OffsetDateTime now = OffsetDateTime.now();
        if (listing.isExpired(now)) {
            throw new InvalidBidException("Auction has already closed. Server time: " + now + ", Closing time: " + listing.getClosingAt());
        }

        // 5. Calculate minimum acceptable bid
        BigDecimal minAcceptable = listing.getMinimumAcceptableBid();

        if (bidAmount.compareTo(minAcceptable) < 0) {
            String msg = (listing.getBidCount() == 0)
                    ? "Bid of ₹" + bidAmount + " is below the starting price of ₹" + listing.getStartingPrice()
                    : "Bid of ₹" + bidAmount + " is below minimum required bid of ₹" + minAcceptable + " (Current bid: ₹" + listing.getCurrentHighestBid() + " + increment: ₹" + listing.getMinimumBidIncrement() + ")";
            throw new InvalidBidException(msg);
        }

        // 6. Check if user is already leading bidder with same or higher amount
        User previousLeadingBidder = listing.getLeadingBidder();

        // 7. Create and record append-only Bid
        Bid bid = Bid.builder()
                .listing(listing)
                .bidder(bidder)
                .amount(bidAmount)
                .build();
        Bid savedBid = bidRepository.save(bid);

        // 8. Update listing's atomic state
        listing.setCurrentHighestBid(bidAmount);
        listing.setLeadingBidder(bidder);
        listing.setBidCount((listing.getBidCount() == null ? 0 : listing.getBidCount()) + 1);
        Listing updatedListing = listingRepository.save(listing);

        // 9. Record audit trail
        auditService.recordEvent(updatedListing, bidder, "BID_ACCEPTED", "Bid of ₹" + bidAmount + " accepted.");

        // 10. Notifications:
        // Outbid notification to previous leader if someone else was leading
        if (previousLeadingBidder != null && !previousLeadingBidder.getId().equals(bidder.getId())) {
            notificationService.createNotification(
                    previousLeadingBidder,
                    NotificationType.OUTBID,
                    "You've been outbid!",
                    "Another student placed a higher bid of ₹" + bidAmount + " on '" + listing.getTitle() + "'. Place a new bid to regain the lead!",
                    updatedListing
            );
        }

        // Notify seller of incoming bid
        notificationService.createNotification(
                listing.getSeller(),
                NotificationType.BID_RECEIVED,
                "New Bid Received: ₹" + bidAmount,
                "A new leading bid of ₹" + bidAmount + " was placed on your item '" + listing.getTitle() + "'.",
                updatedListing
        );

        // 10. Real-time broadcast via WebSocket
        BidDto responseDto = BidDto.fromEntity(savedBid, bidder.getId());
        try {
            // Broadcast new bid to listing's bid topic
            messagingTemplate.convertAndSend("/topic/auctions/" + listingId + "/bids", responseDto);
            // Broadcast updated listing state
            messagingTemplate.convertAndSend("/topic/auctions/" + listingId, ListingDetailDto.fromEntity(updatedListing, null));
            // Broadcast summary card update to marketplace stream
            messagingTemplate.convertAndSend("/topic/auctions", ListingCardDto.fromEntity(updatedListing));
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for bid on listing {}: {}", listingId, e.getMessage());
        }

        return responseDto;
    }

    @Transactional(readOnly = true)
    public List<BidDto> getListingBids(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        Long leadingBidderId = listing.getLeadingBidder() != null ? listing.getLeadingBidder().getId() : null;

        return bidRepository.findByListingIdOrderByCreatedAtDesc(listingId)
                .stream()
                .map(bid -> BidDto.fromEntity(bid, leadingBidderId))
                .toList();
    }
}
