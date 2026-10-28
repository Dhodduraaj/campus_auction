package com.campusauction.ai.dto;

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
public class AiBidConfirmationDto {
    private String authToken;
    private Long listingId;
    private String listingTitle;
    private String listingImageUrl;
    private BigDecimal currentHighestBid;
    private BigDecimal minimumNextValidBid;
    private BigDecimal exactBidAmount;
    private BigDecimal maxAuthorizedAmount;
    private OffsetDateTime closingAt;
    private OffsetDateTime expiresAt;
}
