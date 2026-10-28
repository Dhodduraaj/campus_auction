package com.campusauction.listing.dto;

import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.listing.Listing;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingCardDto {
    private Long id;
    private String title;
    private ListingCategory category;
    private ItemCondition condition;
    private BigDecimal startingPrice;
    private BigDecimal minimumBidIncrement;
    private BigDecimal currentHighestBid;
    private Integer bidCount;
    private OffsetDateTime closingAt;
    private ListingStatus status;
    private String primaryImageUrl;
    private BigDecimal minimumAcceptableBid;
    private boolean isExpired;
    private Long sellerId;
    private String sellerName;
    private Long winnerId;
    private String winnerName;
    private OffsetDateTime closedAt;

    public static ListingCardDto fromEntity(Listing listing) {
        String primaryImage = null;
        if (listing.getImages() != null && !listing.getImages().isEmpty()) {
            primaryImage = listing.getImages().get(0).getImageUrl();
        }

        return ListingCardDto.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .category(listing.getCategory())
                .condition(listing.getCondition())
                .startingPrice(listing.getStartingPrice())
                .minimumBidIncrement(listing.getMinimumBidIncrement())
                .currentHighestBid(listing.getCurrentHighestBid())
                .bidCount(listing.getBidCount())
                .closingAt(listing.getClosingAt())
                .status(listing.getStatus())
                .primaryImageUrl(primaryImage)
                .minimumAcceptableBid(listing.getMinimumAcceptableBid())
                .isExpired(listing.isExpired(OffsetDateTime.now()))
                .sellerId(listing.getSeller() != null ? listing.getSeller().getId() : null)
                .sellerName(listing.getSeller() != null ? listing.getSeller().getName() : null)
                .winnerId(listing.getLeadingBidder() != null ? listing.getLeadingBidder().getId() : null)
                .winnerName(listing.getLeadingBidder() != null ? listing.getLeadingBidder().getName() : null)
                .closedAt(listing.getClosedAt())
                .build();
    }
}
