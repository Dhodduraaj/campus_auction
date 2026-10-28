package com.campusauction.bid;

import com.campusauction.auth.AuthService;
import com.campusauction.bid.dto.BidDto;
import com.campusauction.bid.dto.PlaceBidRequest;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings/{id}/bids")
@RequiredArgsConstructor
@Tag(name = "Bidding", description = "Submit and view auction bids")
public class BidController {

    private final BiddingService biddingService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Get full public bid history for an auction")
    public ResponseEntity<ApiResponse<List<BidDto>>> getBids(@PathVariable("id") Long listingId) {
        List<BidDto> bids = biddingService.getListingBids(listingId);
        return ResponseEntity.ok(ApiResponse.success(bids));
    }

    @PostMapping
    @PreAuthorize("hasRole('JUNIOR') or hasRole('ADMIN')")
    @Operation(summary = "Place a new bid on an open auction")
    public ResponseEntity<ApiResponse<BidDto>> placeBid(
            @PathVariable("id") Long listingId,
            @Valid @RequestBody PlaceBidRequest request
    ) {
        User bidder = authService.getCurrentAuthenticatedUser();
        BidDto bid = biddingService.placeBid(listingId, request, bidder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bid accepted successfully!", bid));
    }
}
