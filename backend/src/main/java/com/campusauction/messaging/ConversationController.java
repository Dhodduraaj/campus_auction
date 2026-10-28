package com.campusauction.messaging;

import com.campusauction.auth.AuthService;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.messaging.dto.ConversationDto;
import com.campusauction.messaging.dto.MessageDto;
import com.campusauction.messaging.dto.SendMessageRequest;
import com.campusauction.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@Tag(name = "Messaging", description = "Secure seller-winner messaging for reserved & completed auctions")
public class ConversationController {

    private final MessagingService messagingService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Get all active conversations for the authenticated user")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getUserConversations() {
        User user = authService.getCurrentAuthenticatedUser();
        List<ConversationDto> list = messagingService.getUserConversations(user);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get conversation by ID")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversationById(@PathVariable("id") Long conversationId) {
        User user = authService.getCurrentAuthenticatedUser();
        ConversationDto dto = messagingService.getConversationById(conversationId, user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get messages in a conversation and mark as read")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getMessages(@PathVariable("id") Long conversationId) {
        User user = authService.getCurrentAuthenticatedUser();
        List<MessageDto> messages = messagingService.getMessages(conversationId, user);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send a message in a conversation")
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            @PathVariable("id") Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        MessageDto dto = messagingService.sendMessage(conversationId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Message sent.", dto));
    }

    @GetMapping("/by-listing/{listingId}")
    @Operation(summary = "Get or create conversation for a reserved/completed auction")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversationByListing(@PathVariable("listingId") Long listingId) {
        User user = authService.getCurrentAuthenticatedUser();
        ConversationDto dto = messagingService.getConversationDtoByListingId(listingId, user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
