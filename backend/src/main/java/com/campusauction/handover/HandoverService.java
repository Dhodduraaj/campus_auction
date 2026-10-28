package com.campusauction.handover;

import com.campusauction.auction.AuctionOutcome;
import com.campusauction.auction.AuctionOutcomeRepository;
import com.campusauction.audit.AuditService;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.NotificationType;
import com.campusauction.common.exception.BadRequestException;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.handover.dto.HandoverDetailDto;
import com.campusauction.handover.dto.PickupFailureRequest;
import com.campusauction.handover.dto.SellerDecisionRequest;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingRepository;
import com.campusauction.listing.dto.ListingCardDto;
import com.campusauction.listing.dto.ListingDetailDto;
import com.campusauction.notification.NotificationService;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class HandoverService {

    private final ListingRepository listingRepository;
    private final AuctionOutcomeRepository auctionOutcomeRepository;
    private final HandoverRepository handoverRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ListingDetailDto handleSellerDecision(Long listingId, SellerDecisionRequest request, User seller) {
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ForbiddenException("Only the seller of this auction can approve or reject the final sale.");
        }

        if (listing.getStatus() != ListingStatus.AWAITING_SELLER_APPROVAL) {
            throw new BadRequestException("Auction is not awaiting seller approval. Current status: " + listing.getStatus());
        }

        AuctionOutcome outcome = auctionOutcomeRepository.findByListingId(listingId)
                .orElseThrow(() -> new BadRequestException("Auction outcome record not found for closing decision."));

        OffsetDateTime now = OffsetDateTime.now();
        outcome.setDecidedAt(now);
        outcome.setDecisionReason(request.getReason());

        if (Boolean.TRUE.equals(request.getApproved())) {
            // Seller Approved -> RESERVED for handover
            listing.setStatus(ListingStatus.RESERVED);
            outcome.setSellerDecision("APPROVED");
            outcome.setFinalStatus(ListingStatus.RESERVED);

            // Initialize Handover record
            Handover handover = handoverRepository.findByListingId(listingId)
                    .orElse(Handover.builder().listing(listing).build());
            handover.setOutcome("PENDING");
            handoverRepository.save(handover);

            notificationService.createNotification(
                    outcome.getProvisionalWinner(),
                    NotificationType.WINNER_APPROVED,
                    "Seller Approved! Item Reserved",
                    "The seller has approved your winning bid of $" + listing.getCurrentHighestBid() + " for '" + listing.getTitle() + "'. Please coordinate campus handover.",
                    listing
            );

            auditService.recordEvent(listing, seller, "SELLER_APPROVED", "Seller approved winning bid of $" + listing.getCurrentHighestBid());
        } else {
            // Seller Rejected -> SELLER_REJECTED
            listing.setStatus(ListingStatus.SELLER_REJECTED);
            listing.setClosedAt(now);
            outcome.setSellerDecision("REJECTED");
            outcome.setFinalStatus(ListingStatus.SELLER_REJECTED);
            outcome.setCompletedAt(now);

            notificationService.createNotification(
                    outcome.getProvisionalWinner(),
                    NotificationType.WINNER_REJECTED,
                    "Seller Declined Offer",
                    "The seller decided not to proceed with the sale of '" + listing.getTitle() + "'. Reason: " + (request.getReason() != null ? request.getReason() : "Price reserve not met"),
                    listing
            );

            auditService.recordEvent(listing, seller, "SELLER_REJECTED", "Seller rejected offer. Reason: " + request.getReason());
        }

        auctionOutcomeRepository.save(outcome);
        Listing savedListing = listingRepository.save(listing);

        broadcastUpdate(savedListing);
        return ListingDetailDto.fromEntity(savedListing, seller.getId());
    }

    @Transactional
    public HandoverDetailDto confirmHandover(Long listingId, User currentUser) {
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        if (listing.getStatus() != ListingStatus.RESERVED) {
            throw new BadRequestException("Item is not in RESERVED status for campus handover. Status: " + listing.getStatus());
        }

        Handover handover = handoverRepository.findByListingId(listingId)
                .orElseThrow(() -> new BadRequestException("Handover record not found for this auction."));

        boolean isSeller = listing.getSeller().getId().equals(currentUser.getId());
        boolean isWinner = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(currentUser.getId());

        if (!isSeller && !isWinner) {
            throw new ForbiddenException("Only the seller or the winning buyer can confirm campus item handover.");
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (isSeller) {
            handover.setSellerConfirmation(true);
            handover.setSellerConfirmedAt(now);
            auditService.recordEvent(listing, currentUser, "HANDOVER_CONFIRMED_SELLER", "Seller marked item as handed over.");
        }

        if (isWinner) {
            handover.setWinnerConfirmation(true);
            handover.setWinnerConfirmedAt(now);
            auditService.recordEvent(listing, currentUser, "HANDOVER_CONFIRMED_BUYER", "Buyer marked item as received.");
        }

        // When both seller and buyer have confirmed, complete the sale
        if (Boolean.TRUE.equals(handover.getSellerConfirmation()) && Boolean.TRUE.equals(handover.getWinnerConfirmation())) {
            handover.setOutcome("COMPLETED");
            handover.setCompletedAt(now);

            listing.setStatus(ListingStatus.SOLD);
            listing.setClosedAt(now);
            listingRepository.save(listing);

            AuctionOutcome outcome = auctionOutcomeRepository.findByListingId(listingId).orElse(null);
            if (outcome != null) {
                outcome.setFinalStatus(ListingStatus.SOLD);
                outcome.setCompletedAt(now);
                auctionOutcomeRepository.save(outcome);
            }

            notificationService.createNotification(
                    listing.getSeller(),
                    NotificationType.HANDOVER_CONFIRMED,
                    "Sale Complete: " + listing.getTitle(),
                    "Both parties confirmed handover! Item is officially marked SOLD.",
                    listing
            );

            notificationService.createNotification(
                    listing.getLeadingBidder(),
                    NotificationType.HANDOVER_CONFIRMED,
                    "Purchase Complete: " + listing.getTitle(),
                    "Both parties confirmed handover! Enjoy your new item.",
                    listing
            );

            auditService.recordEvent(listing, null, "SALE_COMPLETED", "Both parties verified handover. Item sold.");
        }

        Handover savedHandover = handoverRepository.save(handover);
        broadcastUpdate(listing);

        return HandoverDetailDto.fromEntity(savedHandover);
    }

    @Transactional
    public HandoverDetailDto reportPickupFailure(Long listingId, PickupFailureRequest request, User currentUser) {
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        if (listing.getStatus() != ListingStatus.RESERVED) {
            throw new BadRequestException("Can only report failure on active reserved handovers.");
        }

        boolean isSeller = listing.getSeller().getId().equals(currentUser.getId());
        boolean isWinner = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(currentUser.getId());

        if (!isSeller && !isWinner) {
            throw new ForbiddenException("Only the seller or buyer can report a pickup failure.");
        }

        Handover handover = handoverRepository.findByListingId(listingId)
                .orElseThrow(() -> new BadRequestException("Handover record not found."));

        OffsetDateTime now = OffsetDateTime.now();
        handover.setOutcome("FAILED");
        handover.setFailureReason(request.getReason());
        handover.setCompletedAt(now);

        listing.setStatus(ListingStatus.PICKUP_FAILED);
        listing.setClosedAt(now);
        listingRepository.save(listing);

        AuctionOutcome outcome = auctionOutcomeRepository.findByListingId(listingId).orElse(null);
        if (outcome != null) {
            outcome.setFinalStatus(ListingStatus.PICKUP_FAILED);
            outcome.setCompletedAt(now);
            auctionOutcomeRepository.save(outcome);
        }

        User otherParty = isSeller ? listing.getLeadingBidder() : listing.getSeller();
        if (otherParty != null) {
            notificationService.createNotification(
                    otherParty,
                    NotificationType.HANDOVER_FAILED,
                    "Handover Failed: " + listing.getTitle(),
                    "Campus handover was marked failed. Reason: " + request.getReason(),
                    listing
            );
        }

        auditService.recordEvent(listing, currentUser, "PICKUP_FAILED", "Reason: " + request.getReason());
        Handover saved = handoverRepository.save(handover);

        broadcastUpdate(listing);
        return HandoverDetailDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public HandoverDetailDto getHandoverDetails(Long listingId) {
        return handoverRepository.findByListingId(listingId)
                .map(HandoverDetailDto::fromEntity)
                .orElse(null);
    }

    private void broadcastUpdate(Listing listing) {
        try {
            messagingTemplate.convertAndSend("/topic/auctions/" + listing.getId(), ListingDetailDto.fromEntity(listing, null));
            messagingTemplate.convertAndSend("/topic/auctions", ListingCardDto.fromEntity(listing));
        } catch (Exception ignored) {}
    }
}
