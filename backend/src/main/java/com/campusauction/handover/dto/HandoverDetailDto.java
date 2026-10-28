package com.campusauction.handover.dto;

import com.campusauction.handover.Handover;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverDetailDto {
    private Long id;
    private Long listingId;
    private Boolean sellerConfirmation;
    private Boolean winnerConfirmation;
    private OffsetDateTime sellerConfirmedAt;
    private OffsetDateTime winnerConfirmedAt;
    private String outcome;
    private String failureReason;
    private OffsetDateTime completedAt;

    public static HandoverDetailDto fromEntity(Handover handover) {
        if (handover == null) return null;
        return HandoverDetailDto.builder()
                .id(handover.getId())
                .listingId(handover.getListing().getId())
                .sellerConfirmation(handover.getSellerConfirmation())
                .winnerConfirmation(handover.getWinnerConfirmation())
                .sellerConfirmedAt(handover.getSellerConfirmedAt())
                .winnerConfirmedAt(handover.getWinnerConfirmedAt())
                .outcome(handover.getOutcome())
                .failureReason(handover.getFailureReason())
                .completedAt(handover.getCompletedAt())
                .build();
    }
}
