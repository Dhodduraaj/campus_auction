package com.campusauction.bid.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivateAutoBidRequest {

    @NotNull(message = "Maximum amount is required.")
    @DecimalMin(value = "1.00", message = "Maximum amount must be at least ₹1.00.")
    @Digits(integer = 10, fraction = 2, message = "Invalid monetary format.")
    private BigDecimal maxAmount;
}
