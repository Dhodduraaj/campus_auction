package com.campusauction.handover.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDecisionRequest {

    @NotNull(message = "Decision (approved) must be specified")
    private Boolean approved;

    private String reason;
}
