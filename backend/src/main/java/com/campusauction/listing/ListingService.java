package com.campusauction.listing;

import com.campusauction.audit.AuditService;
import com.campusauction.bid.Bid;
import com.campusauction.bid.BidRepository;
import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.NotificationType;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.BadRequestException;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.common.response.PagedResponse;
import com.campusauction.listing.dto.CancelListingRequest;
import com.campusauction.listing.dto.CreateListingRequest;
import com.campusauction.listing.dto.ListingCardDto;
import com.campusauction.listing.dto.ListingDetailDto;
import com.campusauction.listing.dto.UpdateListingRequest;
import com.campusauction.notification.NotificationService;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final BidRepository bidRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.campusauction.bid.AutoBidService autoBidService;

    @Transactional
    public ListingDetailDto createListing(CreateListingRequest request, User seller) {
        if (seller.getRole() != Role.SENIOR && seller.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only Senior accounts can create listings.");
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (request.getClosingAt().isBefore(now.plusMinutes(5))) {
            throw new BadRequestException("Auction closing time must be at least 5 minutes in the future.");
        }

        if (request.getStartingPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Starting price must be greater than zero.");
        }

        if (request.getMinimumBidIncrement().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Minimum bid increment must be greater than zero.");
        }

        Listing listing = Listing.builder()
                .seller(seller)
                .title(request.getTitle().trim())
                .category(request.getCategory())
                .description(request.getDescription().trim())
                .condition(request.getCondition())
                .startingPrice(request.getStartingPrice())
                .minimumBidIncrement(request.getMinimumBidIncrement())
                .currentHighestBid(request.getStartingPrice())
                .closingAt(request.getClosingAt())
                .status(ListingStatus.OPEN)
                .bidCount(0)
                .build();

        Listing savedListing = listingRepository.save(listing);

        // Associate images
        int order = 0;
        for (String url : request.getImageUrls()) {
            ListingImage img = ListingImage.builder()
                    .listing(savedListing)
                    .imageUrl(url)
                    .displayOrder(order++)
                    .build();
            listingImageRepository.save(img);
            savedListing.getImages().add(img);
        }

        auditService.recordEvent(savedListing, seller, "LISTING_CREATED", "Listing created with starting price: " + request.getStartingPrice());

        return ListingDetailDto.fromEntity(savedListing, seller.getId());
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingCardDto> getListings(
            String search,
            ListingCategory category,
            ItemCondition condition,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ListingStatus status,
            Boolean closingSoon,
            Pageable pageable
    ) {
        Specification<Listing> spec = ListingSpecification.filter(
                search, category, condition, minPrice, maxPrice, status, closingSoon
        );

        Page<Listing> page = listingRepository.findAll(spec, pageable);
        return PagedResponse.of(page.map(ListingCardDto::fromEntity));
    }

    @Transactional(readOnly = true)
    public ListingDetailDto getListingById(Long id, Long currentUserId) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found with id: " + id));

        return ListingDetailDto.fromEntity(listing, currentUserId);
    }

    @Transactional
    public ListingDetailDto updateListing(Long id, UpdateListingRequest request, User currentUser) {
        if (currentUser.getRole() != Role.SENIOR && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only Senior accounts can update listings.");
        }

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        if (!listing.getSeller().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not authorized to edit another student's listing.");
        }

        if (listing.getStatus() != ListingStatus.OPEN) {
            throw new BadRequestException("Only open auctions can be modified.");
        }

        // Check if bidding has already started
        boolean hasBids = listing.getBidCount() != null && listing.getBidCount() > 0;

        if (hasBids) {
            // Material changes are strictly prohibited once bids are accepted!
            if (request.getStartingPrice() != null && request.getStartingPrice().compareTo(listing.getStartingPrice()) != 0) {
                throw new BadRequestException("Cannot alter starting price after bids have been placed.");
            }
            if (request.getMinimumBidIncrement() != null && request.getMinimumBidIncrement().compareTo(listing.getMinimumBidIncrement()) != 0) {
                throw new BadRequestException("Cannot alter minimum bid increment after bids have been placed.");
            }
            if (request.getClosingAt() != null && !request.getClosingAt().isEqual(listing.getClosingAt())) {
                throw new BadRequestException("Cannot alter auction closing time after bids have been placed.");
            }
        } else {
            // No bids yet: material fields can be adjusted
            if (request.getStartingPrice() != null) {
                if (request.getStartingPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException("Starting price must be positive.");
                }
                listing.setStartingPrice(request.getStartingPrice());
                listing.setCurrentHighestBid(request.getStartingPrice());
            }
            if (request.getMinimumBidIncrement() != null) {
                if (request.getMinimumBidIncrement().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException("Minimum bid increment must be positive.");
                }
                listing.setMinimumBidIncrement(request.getMinimumBidIncrement());
            }
            if (request.getClosingAt() != null) {
                if (request.getClosingAt().isBefore(OffsetDateTime.now().plusMinutes(5))) {
                    throw new BadRequestException("Closing time must be in the future.");
                }
                listing.setClosingAt(request.getClosingAt());
            }
        }

        // Update non-material fields
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            listing.setTitle(request.getTitle().trim());
        }
        if (request.getCategory() != null) {
            listing.setCategory(request.getCategory());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            listing.setDescription(request.getDescription().trim());
        }
        if (request.getCondition() != null) {
            listing.setCondition(request.getCondition());
        }

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            listing.getImages().clear();
            int order = 0;
            for (String url : request.getImageUrls()) {
                ListingImage img = ListingImage.builder()
                        .listing(listing)
                        .imageUrl(url)
                        .displayOrder(order++)
                        .build();
                listing.getImages().add(img);
            }
        }

        Listing updated = listingRepository.save(listing);
        auditService.recordEvent(updated, currentUser, "LISTING_UPDATED", "Listing updated by seller.");

        return ListingDetailDto.fromEntity(updated, currentUser.getId());
    }

    @Transactional
    public ListingDetailDto cancelListing(Long id, CancelListingRequest request, User currentUser) {
        if (currentUser.getRole() != Role.SENIOR && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only Senior accounts can cancel listings.");
        }

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        if (!listing.getSeller().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not authorized to cancel another student's listing.");
        }

        if (listing.getStatus() != ListingStatus.OPEN) {
            throw new BadRequestException("Only open auctions can be cancelled.");
        }

        listing.setStatus(ListingStatus.CANCELLED);
        listing.setCancellationReason(request.getReason().trim());
        listing.setClosedAt(OffsetDateTime.now());

        Listing saved = listingRepository.save(listing);

        // Notify all participating bidders about the cancellation
        List<Bid> bids = bidRepository.findByListingIdOrderByCreatedAtDesc(id);
        Set<Long> notifiedUserIds = new HashSet<>();
        for (Bid bid : bids) {
            User bidder = bid.getBidder();
            if (bidder != null && notifiedUserIds.add(bidder.getId())) {
                notificationService.createNotification(
                        bidder,
                        NotificationType.AUCTION_CANCELLED,
                        "Auction Cancelled: " + listing.getTitle(),
                        "The auction for '" + listing.getTitle() + "' was cancelled by the seller. Reason: " + request.getReason(),
                        listing
                );
            }
        }

        // Cancel any active auto-bid rules
        autoBidService.onAuctionCancelled(saved);

        auditService.recordEvent(saved, currentUser, "LISTING_CANCELLED", "Cancelled reason: " + request.getReason());

        // Broadcast cancellation via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/auctions/" + id, ListingDetailDto.fromEntity(saved, null));
            messagingTemplate.convertAndSend("/topic/auctions", ListingCardDto.fromEntity(saved));
        } catch (Exception ignored) {}

        return ListingDetailDto.fromEntity(saved, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Page<ListingCardDto> getSellerListings(Long sellerId, String tab, Pageable pageable) {
        if (tab == null || tab.isBlank() || tab.equalsIgnoreCase("all")) {
            return listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable)
                    .map(ListingCardDto::fromEntity);
        }

        List<ListingStatus> statuses;
        switch (tab.toLowerCase()) {
            case "active":
                statuses = List.of(ListingStatus.OPEN);
                break;
            case "awaiting_approval":
                statuses = List.of(ListingStatus.AWAITING_SELLER_APPROVAL);
                break;
            case "reserved":
                statuses = List.of(ListingStatus.RESERVED);
                break;
            case "completed":
                statuses = List.of(ListingStatus.COMPLETED, ListingStatus.SOLD);
                break;
            case "unsuccessful":
                statuses = List.of(ListingStatus.UNSOLD, ListingStatus.SELLER_REJECTED, ListingStatus.CANCELLED, ListingStatus.PICKUP_FAILED);
                break;
            default:
                return listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable)
                        .map(ListingCardDto::fromEntity);
        }

        return listingRepository.findBySellerIdAndStatusIn(sellerId, statuses, pageable)
                .map(ListingCardDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ListingCardDto> getWonListings(Long userId, Pageable pageable) {
        List<ListingStatus> wonStatuses = List.of(ListingStatus.RESERVED, ListingStatus.COMPLETED, ListingStatus.SOLD);
        return listingRepository.findWonListingsByUser(userId, wonStatuses, pageable)
                .map(ListingCardDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ListingCardDto> getListingsBidByUser(Long userId, Pageable pageable) {
        return listingRepository.findListingsBidByUser(userId, pageable)
                .map(ListingCardDto::fromEntity);
    }
}
