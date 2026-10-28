package com.campusauction.ai.dto;

import com.campusauction.listing.dto.ListingCardDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private List<ListingCardDto> recommendations;
    private AiBidConfirmationDto bidConfirmation;
}
