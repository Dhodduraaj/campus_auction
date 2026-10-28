package com.campusauction.listing.dto;

import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingImage;
import com.campusauction.user.dto.UserSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingDetailDto {
    private Long id;
    private String title;
    private ListingCategory category;
    private String description;
    private ItemCondition condition;
    private BigDecimal startingPrice;
    private BigDecimal minimumBidIncrement;
    private BigDecimal currentHighestBid;
    private Integer bidCount;
    private BigDecimal minimumAcceptableBid;
    private OffsetDateTime closingAt;
    private ListingStatus status;
    private String cancellationReason;
    private List<String> imageUrls;
    private UserSummaryDto seller;
    private String leadingBidderDisplayName;
    private Long leadingBidderId;
    private boolean isExpired;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime closedAt;

    public static ListingDetailDto fromEntity(Listing listing, Long currentUserId) {
        List<String> images = listing.getImages() != null
                ? listing.getImages().stream().map(ListingImage::getImageUrl).toList()
                : Collections.emptyList();

        String bidderDisplayName = null;
        Long leadingId = null;
        if (listing.getLeadingBidder() != null) {
            leadingId = listing.getLeadingBidder().getId();
            String name = listing.getLeadingBidder().getName();
            // Anonymize public display name nicely: "Alex M." or "Student #id"
            String[] parts = name.trim().split("\\s+");
            if (parts.length > 1) {
                bidderDisplayName = parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
            } else {
                bidderDisplayName = parts[0];
            }
        }

        return ListingDetailDto.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .category(listing.getCategory())
                .description(listing.getDescription())
                .condition(listing.getCondition())
                .startingPrice(listing.getStartingPrice())
                .minimumBidIncrement(listing.getMinimumBidIncrement())
                .currentHighestBid(listing.getCurrentHighestBid())
                .bidCount(listing.getBidCount())
                .minimumAcceptableBid(listing.getMinimumAcceptableBid())
                .closingAt(listing.getClosingAt())
                .status(listing.getStatus())
                .cancellationReason(listing.getCancellationReason())
                .imageUrls(images)
                .seller(UserSummaryDto.fromEntity(listing.getSeller()))
                .leadingBidderDisplayName(bidderDisplayName)
                .leadingBidderId(leadingId)
                .isExpired(listing.isExpired(OffsetDateTime.now()))
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .closedAt(listing.getClosedAt())
                .build();
    }
}
