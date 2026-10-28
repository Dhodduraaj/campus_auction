package com.campusauction.handover;

import com.campusauction.auth.AuthService;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.handover.dto.HandoverDetailDto;
import com.campusauction.handover.dto.PickupFailureRequest;
import com.campusauction.handover.dto.SellerDecisionRequest;
import com.campusauction.listing.dto.ListingDetailDto;
import com.campusauction.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings/{id}")
@RequiredArgsConstructor
@Tag(name = "Auction Outcomes & Handover", description = "Seller approvals, winner reservation, and campus item handovers")
public class HandoverController {

    private final HandoverService handoverService;
    private final AuthService authService;

    @PostMapping("/approve-winner")
    @PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')")
    @Operation(summary = "Seller approves the winning price reserve")
    public ResponseEntity<ApiResponse<ListingDetailDto>> approveWinner(
            @PathVariable("id") Long listingId,
            @RequestBody(required = false) SellerDecisionRequest request
    ) {
        User seller = authService.getCurrentAuthenticatedUser();
        if (request == null) {
            request = SellerDecisionRequest.builder().approved(true).build();
        } else {
            request.setApproved(true);
        }
        ListingDetailDto dto = handoverService.handleSellerDecision(listingId, request, seller);
        return ResponseEntity.ok(ApiResponse.success("Winning bid approved! Item is reserved for buyer.", dto));
    }

    @PostMapping("/reject-winner")
    @PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')")
    @Operation(summary = "Seller rejects the provisional winning bid")
    public ResponseEntity<ApiResponse<ListingDetailDto>> rejectWinner(
            @PathVariable("id") Long listingId,
            @RequestBody(required = false) SellerDecisionRequest request
    ) {
        User seller = authService.getCurrentAuthenticatedUser();
        if (request == null) {
            request = SellerDecisionRequest.builder().approved(false).reason("Reserve not met").build();
        } else {
            request.setApproved(false);
        }
        ListingDetailDto dto = handoverService.handleSellerDecision(listingId, request, seller);
        return ResponseEntity.ok(ApiResponse.success("Provisional bid rejected.", dto));
    }

    @PostMapping("/confirm-handover")
    @Operation(summary = "Confirm handover (both seller and buyer must confirm)")
    public ResponseEntity<ApiResponse<HandoverDetailDto>> confirmHandover(
            @PathVariable("id") Long listingId
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        HandoverDetailDto dto = handoverService.confirmHandover(listingId, user);
        return ResponseEntity.ok(ApiResponse.success("Handover confirmation recorded.", dto));
    }

    @PostMapping("/report-pickup-failure")
    @Operation(summary = "Report that campus item handover failed")
    public ResponseEntity<ApiResponse<HandoverDetailDto>> reportPickupFailure(
            @PathVariable("id") Long listingId,
            @Valid @RequestBody PickupFailureRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        HandoverDetailDto dto = handoverService.reportPickupFailure(listingId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Pickup failure recorded.", dto));
    }

    @GetMapping("/handover")
    @Operation(summary = "Get current handover status for an auction")
    public ResponseEntity<ApiResponse<HandoverDetailDto>> getHandover(
            @PathVariable("id") Long listingId
    ) {
        HandoverDetailDto dto = handoverService.getHandoverDetails(listingId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
