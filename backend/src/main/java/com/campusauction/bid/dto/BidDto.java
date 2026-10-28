package com.campusauction.bid.dto;

import com.campusauction.bid.Bid;
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
public class BidDto {
    private Long id;
    private Long listingId;
    private String bidderDisplayName;
    private BigDecimal amount;
    private OffsetDateTime createdAt;
    private boolean isLeading;

    public static BidDto fromEntity(Bid bid, Long leadingBidderId) {
        String displayName = "Anonymous Bidder";
        if (bid.getBidder() != null) {
            String name = bid.getBidder().getName().trim();
            String[] parts = name.split("\\s+");
            if (parts.length > 1) {
                displayName = parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
            } else {
                displayName = parts[0];
            }
        }

        boolean isLead = leadingBidderId != null && bid.getBidder() != null && leadingBidderId.equals(bid.getBidder().getId());

        return BidDto.builder()
                .id(bid.getId())
                .listingId(bid.getListing().getId())
                .bidderDisplayName(displayName)
                .amount(bid.getAmount())
                .createdAt(bid.getCreatedAt())
                .isLeading(isLead)
                .build();
    }
}
