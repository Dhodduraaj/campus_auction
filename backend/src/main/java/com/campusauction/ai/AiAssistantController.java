package com.campusauction.ai;

import com.campusauction.ai.dto.AiChatRequest;
import com.campusauction.ai.dto.AiChatResponse;
import com.campusauction.ai.dto.AiConfirmBidRequest;
import com.campusauction.auth.AuthService;
import com.campusauction.bid.dto.BidDto;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "Groq-powered grounded auction discovery, natural language query, and explicit bidding")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final AuthService authService;

    @PostMapping("/chat")
    @Operation(summary = "Ask the AI assistant about campus auctions and discover items")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest request) {
        User currentUser = null;
        try {
            currentUser = authService.getCurrentAuthenticatedUser();
        } catch (Exception ignored) {}

        AiChatResponse response = aiAssistantService.chat(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/confirm-bid")
    @PreAuthorize("hasRole('JUNIOR') or hasRole('ADMIN')")
    @Operation(summary = "Confirm and place an AI-assisted bid using a server-issued authorization token")
    public ResponseEntity<ApiResponse<BidDto>> confirmBid(@Valid @RequestBody AiConfirmBidRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        BidDto bid = aiAssistantService.confirmBid(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Bid placed successfully!", bid));
    }
}
