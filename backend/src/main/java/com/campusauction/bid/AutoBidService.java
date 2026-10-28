package com.campusauction.bid;

import com.campusauction.audit.AuditService;
import com.campusauction.bid.dto.ActivateAutoBidRequest;
import com.campusauction.bid.dto.AutoBidRuleDto;
import com.campusauction.bid.dto.BidDto;
import com.campusauction.common.enums.AutoBidStatus;
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
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AutoBidService {

    private static final Logger log = LoggerFactory.getLogger(AutoBidService.class);

    private final AutoBidRuleRepository autoBidRuleRepository;
    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AutoBidRuleDto activateOrUpdate(Long listingId, ActivateAutoBidRequest request, User buyer) {
        BigDecimal maxAmount = request.getMaxAmount();

        if (maxAmount == null || maxAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidBidException("Maximum amount must be a positive number.");
        }

        // 1. Role enforcement: Only Junior accounts can configure automatic bidding
        if (buyer.getRole() != Role.JUNIOR && buyer.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only Junior accounts can configure automatic bidding.");
        }

        // 2. Lock listing row for write
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found with id: " + listingId));

        // 3. Seller cannot bid on own listing
        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new ForbiddenException("Sellers cannot bid on their own listings.");
        }

        // 4. Status and expiration check
        if (listing.getStatus() != ListingStatus.OPEN) {
            throw new InvalidBidException("Auction is not open for bidding. Current status: " + listing.getStatus());
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (listing.isExpired(now)) {
            throw new InvalidBidException("Auction has already closed at " + listing.getClosingAt());
        }

        // 5. Minimum limit validations
        boolean isCurrentLeader = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(buyer.getId());
        BigDecimal minAcceptable = listing.getMinimumAcceptableBid();

        if (isCurrentLeader) {
            // Cannot lower max below current accepted bid
            if (maxAmount.compareTo(listing.getCurrentHighestBid()) < 0) {
                throw new InvalidBidException("Your maximum limit (₹" + maxAmount + ") cannot be lower than your current leading bid of ₹" +
                        listing.getCurrentHighestBid() + ". You may pause or cancel automatic bidding to prevent future bids.");
            }
        } else {
            // Must be at least the next minimum valid bid
            if (maxAmount.compareTo(minAcceptable) < 0) {
                String msg = (listing.getBidCount() == 0)
                        ? "Maximum limit of ₹" + maxAmount + " must be at least the starting price of ₹" + listing.getStartingPrice()
                        : "Maximum limit of ₹" + maxAmount + " must be at least the next minimum valid bid of ₹" + minAcceptable;
                throw new InvalidBidException(msg);
            }
        }

        // 6. Persist or update rule
        AutoBidRule rule = autoBidRuleRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
                .orElseGet(() -> AutoBidRule.builder()
                        .listing(listing)
                        .buyer(buyer)
                        .build());

        rule.setMaxAmount(maxAmount);
        rule.setStatus(AutoBidStatus.ACTIVE);
        AutoBidRule savedRule = autoBidRuleRepository.save(rule);

        // 7. Resolve proxy bids
        resolveProxyBidsInternal(listing);

        // 8. Notifications & Audit
        auditService.recordEvent(listing, buyer, "AUTO_BID_CONFIGURED", "Configured automatic bidding with limit of ₹" + maxAmount);
        notificationService.createNotification(
                buyer,
                NotificationType.AUTO_BID_ACTIVATED,
                "Automatic Bidding Activated",
                "Automatic bidding is active on '" + listing.getTitle() + "' with a maximum limit of ₹" + maxAmount + ".",
                listing
        );

        boolean isLeadingNow = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(buyer.getId());
        return AutoBidRuleDto.fromEntity(savedRule, listing.getCurrentHighestBid(), listing.getMinimumAcceptableBid(), isLeadingNow);
    }

    @Transactional(readOnly = true)
    public Optional<AutoBidRuleDto> getMyRule(Long listingId, User buyer) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        return autoBidRuleRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
                .map(rule -> {
                    boolean isLeading = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(buyer.getId());
                    return AutoBidRuleDto.fromEntity(rule, listing.getCurrentHighestBid(), listing.getMinimumAcceptableBid(), isLeading);
                });
    }

    @Transactional
    public AutoBidRuleDto pauseRule(Long listingId, User buyer) {
        AutoBidRule rule = autoBidRuleRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No automatic bidding rule found for this listing."));

        rule.setStatus(AutoBidStatus.PAUSED);
        AutoBidRule savedRule = autoBidRuleRepository.save(rule);

        Listing listing = rule.getListing();
        boolean isLeading = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(buyer.getId());
        return AutoBidRuleDto.fromEntity(savedRule, listing.getCurrentHighestBid(), listing.getMinimumAcceptableBid(), isLeading);
    }

    @Transactional
    public AutoBidRuleDto resumeRule(Long listingId, User buyer) {
        Listing listing = listingRepository.findByIdWithPessimisticLock(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        if (listing.getStatus() != ListingStatus.OPEN || listing.isExpired(OffsetDateTime.now())) {
            throw new InvalidBidException("Cannot resume automatic bidding because this auction is closed.");
        }

        AutoBidRule rule = autoBidRuleRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No automatic bidding rule found for this listing."));

        rule.setStatus(AutoBidStatus.ACTIVE);
        AutoBidRule savedRule = autoBidRuleRepository.save(rule);

        resolveProxyBidsInternal(listing);

        boolean isLeading = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(buyer.getId());
        return AutoBidRuleDto.fromEntity(savedRule, listing.getCurrentHighestBid(), listing.getMinimumAcceptableBid(), isLeading);
    }

    @Transactional
    public AutoBidRuleDto cancelRule(Long listingId, User buyer) {
        AutoBidRule rule = autoBidRuleRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No automatic bidding rule found for this listing."));

        rule.setStatus(AutoBidStatus.CANCELLED);
        AutoBidRule savedRule = autoBidRuleRepository.save(rule);

        notificationService.createNotification(
                buyer,
                NotificationType.AUTO_BID_CANCELLED,
                "Automatic Bidding Cancelled",
                "You have cancelled automatic bidding for '" + rule.getListing().getTitle() + "'.",
                rule.getListing()
        );

        Listing listing = rule.getListing();
        boolean isLeading = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(buyer.getId());
        return AutoBidRuleDto.fromEntity(savedRule, listing.getCurrentHighestBid(), listing.getMinimumAcceptableBid(), isLeading);
    }

    @Transactional
    public void triggerProxyBidsAfterNewBid(Listing listing, User triggeringBidder) {
        resolveProxyBidsInternal(listing);
    }

    @Transactional
    public void onAuctionClosed(Listing listing, User winner) {
        List<AutoBidRule> activeRules = autoBidRuleRepository.findByListingId(listing.getId());
        for (AutoBidRule rule : activeRules) {
            if (rule.getStatus() == AutoBidStatus.ACTIVE || rule.getStatus() == AutoBidStatus.PAUSED) {
                if (winner != null && rule.getBuyer().getId().equals(winner.getId())) {
                    rule.setStatus(AutoBidStatus.WON);
                } else {
                    rule.setStatus(AutoBidStatus.LOST);
                }
                autoBidRuleRepository.save(rule);
            }
        }
    }

    @Transactional
    public void onAuctionCancelled(Listing listing) {
        List<AutoBidRule> activeRules = autoBidRuleRepository.findByListingId(listing.getId());
        for (AutoBidRule rule : activeRules) {
            if (rule.getStatus() == AutoBidStatus.ACTIVE || rule.getStatus() == AutoBidStatus.PAUSED) {
                rule.setStatus(AutoBidStatus.CANCELLED);
                autoBidRuleRepository.save(rule);
                notificationService.createNotification(
                        rule.getBuyer(),
                        NotificationType.AUCTION_CANCELLED,
                        "Auction Cancelled",
                        "The auction for '" + listing.getTitle() + "' was cancelled. Your automatic bidding rule has been terminated.",
                        listing
                );
            }
        }
    }

    /**
     * Authoritative Proxy Bidding Resolution Engine
     * Executes inside an active database transaction with PESSIMISTIC_WRITE lock on the listing row.
     */
    private void resolveProxyBidsInternal(Listing listing) {
        List<AutoBidRule> activeRules = autoBidRuleRepository.findByListingIdAndStatus(listing.getId(), AutoBidStatus.ACTIVE);
        if (activeRules.isEmpty()) {
            return;
        }

        User currentLeader = listing.getLeadingBidder();

        // Separate current leader's rule (if any) from other contenders
        Optional<AutoBidRule> leaderRuleOpt = (currentLeader == null)
                ? Optional.empty()
                : activeRules.stream().filter(r -> r.getBuyer().getId().equals(currentLeader.getId())).findFirst();

        List<AutoBidRule> contenders = activeRules.stream()
                .filter(r -> currentLeader == null || !r.getBuyer().getId().equals(currentLeader.getId()))
                .toList();

        if (contenders.isEmpty()) {
            return;
        }

        BigDecimal minAcceptable = listing.getMinimumAcceptableBid();

        // Sort contenders by maxAmount DESC, then earliest createdAt ASC (tie-breaker: first to register wins)
        List<AutoBidRule> eligibleContenders = contenders.stream()
                .filter(r -> r.getMaxAmount().compareTo(minAcceptable) >= 0)
                .sorted(Comparator.comparing(AutoBidRule::getMaxAmount).reversed()
                        .thenComparing(AutoBidRule::getCreatedAt))
                .toList();

        // Any contenders whose max cannot meet minAcceptable are outbid
        for (AutoBidRule contender : contenders) {
            if (contender.getMaxAmount().compareTo(minAcceptable) < 0) {
                contender.setStatus(AutoBidStatus.OUTBID);
                autoBidRuleRepository.save(contender);
                notificationService.createNotification(
                        contender.getBuyer(),
                        NotificationType.AUTO_BID_OUTBID,
                        "You've been outbid!",
                        "Your automatic bidding limit of ₹" + contender.getMaxAmount() + " on '" + listing.getTitle() +
                                "' was reached or exceeded. Current bid is ₹" + listing.getCurrentHighestBid() + ".",
                        listing
                );
            }
        }

        if (eligibleContenders.isEmpty()) {
            return;
        }

        AutoBidRule topContender = eligibleContenders.get(0);
        AutoBidRule runnerUpContender = eligibleContenders.size() > 1 ? eligibleContenders.get(1) : null;

        BigDecimal increment = listing.getMinimumBidIncrement();

        if (leaderRuleOpt.isEmpty()) {
            // Current leader is a manual bidder (or no bids yet)
            if (runnerUpContender == null) {
                // Only one active contender: place the exact minimum valid bid
                BigDecimal bidToPlace = minAcceptable;
                placeProxyBid(listing, topContender.getBuyer(), bidToPlace, "Automatic bid to take the lead.");
            } else {
                // Two or more contenders competing against each other:
                // Runner-up drives price to their maxAmount, topContender outbids them
                BigDecimal runnerUpMax = runnerUpContender.getMaxAmount();
                BigDecimal topMax = topContender.getMaxAmount();

                if (topMax.compareTo(runnerUpMax) > 0) {
                    // Runner up places their max
                    placeProxyBid(listing, runnerUpContender.getBuyer(), runnerUpMax, "Automatic defense bid.");
                    runnerUpContender.setStatus(AutoBidStatus.OUTBID);
                    autoBidRuleRepository.save(runnerUpContender);
                    notificationService.createNotification(
                            runnerUpContender.getBuyer(),
                            NotificationType.AUTO_BID_OUTBID,
                            "You've been outbid!",
                            "Your automatic bidding limit of ₹" + runnerUpMax + " on '" + listing.getTitle() +
                                    "' was reached. Current bid is now higher.",
                            listing
                    );

                    // Top contender places minimum needed to beat runner up
                    BigDecimal topBid = runnerUpMax.add(increment).min(topMax);
                    placeProxyBid(listing, topContender.getBuyer(), topBid, "Automatic counterbid taking the lead.");
                } else {
                    // Tie on max: topContender won tie-breaker because of earlier createdAt
                    placeProxyBid(listing, runnerUpContender.getBuyer(), runnerUpMax, "Automatic defense bid.");
                    runnerUpContender.setStatus(AutoBidStatus.OUTBID);
                    autoBidRuleRepository.save(runnerUpContender);

                    placeProxyBid(listing, topContender.getBuyer(), topMax, "Automatic winning tie-breaker bid.");
                }
            }
        } else {
            // Competition between active leader and top contender
            AutoBidRule leaderRule = leaderRuleOpt.get();
            BigDecimal leaderMax = leaderRule.getMaxAmount();
            BigDecimal contenderMax = topContender.getMaxAmount();

            if (contenderMax.compareTo(leaderMax) > 0) {
                // Contender beats existing leader!
                // Existing leader defends up to leaderMax
                placeProxyBid(listing, leaderRule.getBuyer(), leaderMax, "Automatic defense bid.");
                leaderRule.setStatus(AutoBidStatus.OUTBID);
                autoBidRuleRepository.save(leaderRule);
                notificationService.createNotification(
                        leaderRule.getBuyer(),
                        NotificationType.AUTO_BID_OUTBID,
                        "You've been outbid!",
                        "Your automatic bidding limit of ₹" + leaderMax + " on '" + listing.getTitle() +
                                "' was reached. A higher automatic bid has taken the lead.",
                        listing
                );

                // Contender takes lead
                BigDecimal contenderBid = leaderMax.add(increment).min(contenderMax);
                placeProxyBid(listing, topContender.getBuyer(), contenderBid, "Automatic bid taking the lead.");
            } else if (contenderMax.compareTo(leaderMax) == 0) {
                // Tie on max: leader was earlier (already registered and leading)
                // Contender cannot beat leader
                placeProxyBid(listing, leaderRule.getBuyer(), leaderMax, "Automatic defense bid to maximum limit.");
                topContender.setStatus(AutoBidStatus.OUTBID);
                autoBidRuleRepository.save(topContender);
                notificationService.createNotification(
                        topContender.getBuyer(),
                        NotificationType.AUTO_BID_OUTBID,
                        "You've been outbid!",
                        "An earlier automatic bidder holds the lead at the same limit of ₹" + leaderMax + " on '" + listing.getTitle() + "'.",
                        listing
                );
            } else {
                // Contender's max is lower than leader's max
                // Contender bids up to their max
                placeProxyBid(listing, topContender.getBuyer(), contenderMax, "Automatic bid up to maximum limit.");
                topContender.setStatus(AutoBidStatus.OUTBID);
                autoBidRuleRepository.save(topContender);
                notificationService.createNotification(
                        topContender.getBuyer(),
                        NotificationType.AUTO_BID_OUTBID,
                        "You've been outbid!",
                        "Your automatic bidding limit of ₹" + contenderMax + " on '" + listing.getTitle() +
                                "' was reached.",
                        listing
                );

                // Leader automatically defends with minimum increment needed
                BigDecimal leaderCounter = contenderMax.add(increment).min(leaderMax);
                placeProxyBid(listing, leaderRule.getBuyer(), leaderCounter, "Automatic counterbid defending lead.");
            }
        }
    }

    private void placeProxyBid(Listing listing, User bidder, BigDecimal amount, String auditReason) {
        // Only place if it is higher than current highest bid or is the first bid
        if (listing.getCurrentHighestBid() != null && amount.compareTo(listing.getCurrentHighestBid()) <= 0 && listing.getBidCount() > 0) {
            return;
        }

        User previousLeader = listing.getLeadingBidder();

        Bid bid = Bid.builder()
                .listing(listing)
                .bidder(bidder)
                .amount(amount)
                .build();
        Bid savedBid = bidRepository.save(bid);

        listing.setCurrentHighestBid(amount);
        listing.setLeadingBidder(bidder);
        listing.setBidCount((listing.getBidCount() == null ? 0 : listing.getBidCount()) + 1);
        Listing updatedListing = listingRepository.save(listing);

        auditService.recordEvent(updatedListing, bidder, "AUTO_BID_ACCEPTED", auditReason + " Amount: ₹" + amount);

        // Notify previous leader if someone else was leading
        if (previousLeader != null && !previousLeader.getId().equals(bidder.getId())) {
            notificationService.createNotification(
                    previousLeader,
                    NotificationType.OUTBID,
                    "You've been outbid!",
                    "A new leading bid of ₹" + amount + " was placed on '" + listing.getTitle() + "'.",
                    updatedListing
            );
        }

        // Notify auto-bidder that their proxy placed a bid
        notificationService.createNotification(
                bidder,
                NotificationType.AUTO_BID_LEAD_REGAINED,
                "Automatic Bid Placed: ₹" + amount,
                "Your automatic bid of ₹" + amount + " is now the leading bid on '" + listing.getTitle() + "'.",
                updatedListing
        );

        // Notify seller of incoming bid
        notificationService.createNotification(
                listing.getSeller(),
                NotificationType.BID_RECEIVED,
                "New Bid Received: ₹" + amount,
                "A new leading bid of ₹" + amount + " was placed on your item '" + listing.getTitle() + "'.",
                updatedListing
        );

        // Real-time broadcast
        try {
            BidDto bidDto = BidDto.fromEntity(savedBid, bidder.getId());
            messagingTemplate.convertAndSend("/topic/auctions/" + listing.getId() + "/bids", bidDto);
            messagingTemplate.convertAndSend("/topic/auctions/" + listing.getId(), ListingDetailDto.fromEntity(updatedListing, null));
            messagingTemplate.convertAndSend("/topic/auctions", ListingCardDto.fromEntity(updatedListing));
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for auto-bid on listing {}: {}", listing.getId(), e.getMessage());
        }
    }
}
