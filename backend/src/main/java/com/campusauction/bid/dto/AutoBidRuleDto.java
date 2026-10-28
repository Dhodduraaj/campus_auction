package com.campusauction.bid.dto;

import com.campusauction.bid.AutoBidRule;
import com.campusauction.common.enums.AutoBidStatus;
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
public class AutoBidRuleDto {
    private Long id;
    private Long listingId;
    private String listingTitle;
    private BigDecimal maxAmount;
    private AutoBidStatus status;
    private BigDecimal currentHighestBid;
    private BigDecimal minimumAcceptableBid;
    private boolean isLeading;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static AutoBidRuleDto fromEntity(AutoBidRule rule, BigDecimal currentHighestBid, BigDecimal minimumAcceptableBid, boolean isLeading) {
        return AutoBidRuleDto.builder()
                .id(rule.getId())
                .listingId(rule.getListing().getId())
                .listingTitle(rule.getListing().getTitle())
                .maxAmount(rule.getMaxAmount())
                .status(rule.getStatus())
                .currentHighestBid(currentHighestBid)
                .minimumAcceptableBid(minimumAcceptableBid)
                .isLeading(isLeading)
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
