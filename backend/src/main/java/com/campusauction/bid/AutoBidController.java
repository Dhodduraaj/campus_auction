package com.campusauction.bid;

import com.campusauction.auth.AuthService;
import com.campusauction.bid.dto.ActivateAutoBidRequest;
import com.campusauction.bid.dto.AutoBidRuleDto;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings/{listingId}/auto-bid")
@RequiredArgsConstructor
@Tag(name = "Automatic Bidding", description = "Automatic proxy bidding configuration and management")
public class AutoBidController {

    private final AutoBidService autoBidService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    @Operation(summary = "Activate or update automatic bidding rule")
    public ResponseEntity<ApiResponse<AutoBidRuleDto>> activateOrUpdate(
            @PathVariable Long listingId,
            @Valid @RequestBody ActivateAutoBidRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.activateOrUpdate(listingId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Automatic bidding activated successfully", dto));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user's automatic bidding rule for listing")
    public ResponseEntity<ApiResponse<AutoBidRuleDto>> getMyRule(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.getMyRule(listingId, currentUser).orElse(null);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PutMapping("/pause")
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    @Operation(summary = "Pause automatic bidding")
    public ResponseEntity<ApiResponse<AutoBidRuleDto>> pause(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.pauseRule(listingId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Automatic bidding paused", dto));
    }

    @PutMapping("/resume")
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    @Operation(summary = "Resume automatic bidding")
    public ResponseEntity<ApiResponse<AutoBidRuleDto>> resume(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.resumeRule(listingId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Automatic bidding resumed", dto));
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    @Operation(summary = "Cancel automatic bidding")
    public ResponseEntity<ApiResponse<AutoBidRuleDto>> cancel(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.cancelRule(listingId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Automatic bidding cancelled", dto));
    }
}
