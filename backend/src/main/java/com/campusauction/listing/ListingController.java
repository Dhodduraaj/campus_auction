package com.campusauction.listing;

import com.campusauction.auth.AuthService;
import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.common.response.PagedResponse;
import com.campusauction.listing.dto.CancelListingRequest;
import com.campusauction.listing.dto.CreateListingRequest;
import com.campusauction.listing.dto.ListingCardDto;
import com.campusauction.listing.dto.ListingDetailDto;
import com.campusauction.listing.dto.UpdateListingRequest;
import com.campusauction.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@Tag(name = "Listings", description = "Marketplace auction creation, browsing, editing, and cancellation")
public class ListingController {

    private final ListingService listingService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Search and filter auctions with backend pagination")
    public ResponseEntity<ApiResponse<PagedResponse<ListingCardDto>>> getListings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ListingCategory category,
            @RequestParam(required = false) ItemCondition condition,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) ListingStatus status,
            @RequestParam(required = false) Boolean closingSoon,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "closingAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        Sort sort = sortDirection.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        PagedResponse<ListingCardDto> response = listingService.getListings(
                search, category, condition, minPrice, maxPrice, status, closingSoon, pageable
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full auction details by id")
    public ResponseEntity<ApiResponse<ListingDetailDto>> getListingById(@PathVariable Long id) {
        Long currentUserId = null;
        try {
            User user = authService.getCurrentAuthenticatedUser();
            currentUserId = user.getId();
        } catch (Exception ignored) {}

        ListingDetailDto dto = listingService.getListingById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new auction listing")
    public ResponseEntity<ApiResponse<ListingDetailDto>> createListing(
            @Valid @RequestBody CreateListingRequest request
    ) {
        User seller = authService.getCurrentAuthenticatedUser();
        ListingDetailDto dto = listingService.createListing(request, seller);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listing created successfully", dto));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')")
    @Operation(summary = "Update auction listing (restricted if bids exist)")
    public ResponseEntity<ApiResponse<ListingDetailDto>> updateListing(
            @PathVariable Long id,
            @Valid @RequestBody UpdateListingRequest request
    ) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ListingDetailDto dto = listingService.updateListing(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Listing updated successfully", dto));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')")
    @Operation(summary = "Cancel an auction listing")
    public ResponseEntity<ApiResponse<ListingDetailDto>> cancelListing(
            @PathVariable Long id,
            @Valid @RequestBody CancelListingRequest request
    ) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ListingDetailDto dto = listingService.cancelListing(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Auction cancelled successfully", dto));
    }
}
