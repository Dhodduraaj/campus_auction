package com.campusauction.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConfirmBidRequest {

    @NotBlank(message = "Auth token cannot be blank")
    private String authToken;
}
