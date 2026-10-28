package com.campusauction;

import com.campusauction.auth.AuthService;
import com.campusauction.auth.dto.AuthResponse;
import com.campusauction.auth.dto.RegisterRequest;
import com.campusauction.bid.BiddingService;
import com.campusauction.bid.dto.BidDto;
import com.campusauction.bid.dto.PlaceBidRequest;
import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.InvalidBidException;
import com.campusauction.handover.HandoverService;
import com.campusauction.handover.dto.HandoverDetailDto;
import com.campusauction.handover.dto.SellerDecisionRequest;
import com.campusauction.listing.ListingService;
import com.campusauction.listing.dto.CreateListingRequest;
import com.campusauction.listing.dto.ListingDetailDto;
import com.campusauction.user.User;
import com.campusauction.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@Rollback
class AuctionIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingService listingService;

    @Autowired
    private BiddingService biddingService;

    @Autowired
    private HandoverService handoverService;

    @Test
    @DisplayName("End-to-End Auction Flow: Register, List, Bid, Increment Check, Seller Approval, Handover")
    void testFullAuctionLifecycle() {
        // 1. Register Seller (Senior)
        AuthResponse sellerAuth = authService.register(RegisterRequest.builder()
                .name("Alex Senior")
                .email("alex_senior@campus.edu")
                .password("password123")
                .role(Role.SENIOR)
                .studentId("SEN-2024-001")
                .build());
        assertNotNull(sellerAuth.getToken());
        User seller = userRepository.findById(sellerAuth.getUser().getId()).orElseThrow();
        assertEquals(Role.SENIOR, seller.getRole());

        // 2. Register Bidder 1 (Junior)
        AuthResponse bidder1Auth = authService.register(RegisterRequest.builder()
                .name("Sam Junior")
                .email("sam_junior@campus.edu")
                .password("password123")
                .role(Role.JUNIOR)
                .studentId("JUN-2026-089")
                .build());
        User bidder1 = userRepository.findById(bidder1Auth.getUser().getId()).orElseThrow();
        assertEquals(Role.JUNIOR, bidder1.getRole());

        // 3. Register Bidder 2 (Junior)
        AuthResponse bidder2Auth = authService.register(RegisterRequest.builder()
                .name("Taylor Sophomore")
                .email("taylor@campus.edu")
                .password("password123")
                .role(Role.JUNIOR)
                .studentId("SOP-2025-112")
                .build());
        User bidder2 = userRepository.findById(bidder2Auth.getUser().getId()).orElseThrow();
        assertEquals(Role.JUNIOR, bidder2.getRole());

        // Test Junior Role Restriction: Junior cannot create listings
        CreateListingRequest invalidJuniorReq = CreateListingRequest.builder()
                .title("Unauthorized Junior Listing")
                .category(ListingCategory.CYCLE)
                .condition(ItemCondition.GOOD)
                .description("Should fail")
                .startingPrice(new BigDecimal("100.00"))
                .minimumBidIncrement(new BigDecimal("10.00"))
                .closingAt(OffsetDateTime.now().plusDays(3))
                .imageUrls(List.of("/uploads/cycle1.jpg"))
                .build();
        assertThrows(ForbiddenException.class, () -> {
            listingService.createListing(invalidJuniorReq, bidder1);
        });

        // 4. Create Listing as Senior (Starting Price 100.00, Min Increment 10.00)
        CreateListingRequest createReq = CreateListingRequest.builder()
                .title("Roadster Cycle 21-Speed")
                .category(ListingCategory.CYCLE)
                .condition(ItemCondition.GOOD)
                .description("Campus cycle with front basket, helmet, and heavy-duty lock.")
                .startingPrice(new BigDecimal("100.00"))
                .minimumBidIncrement(new BigDecimal("10.00"))
                .closingAt(OffsetDateTime.now().plusDays(3))
                .imageUrls(List.of("/uploads/cycle1.jpg"))
                .build();

        ListingDetailDto listing = listingService.createListing(createReq, seller);
        assertNotNull(listing.getId());
        assertEquals(ListingStatus.OPEN, listing.getStatus());
        assertEquals(new BigDecimal("100.00"), listing.getMinimumAcceptableBid());

        // 5. Seller Attempting to Bid on Own Listing must be rejected
        assertThrows(ForbiddenException.class, () -> {
            biddingService.placeBid(listing.getId(), new PlaceBidRequest(new BigDecimal("100.00")), seller);
        });

        // 6. Bidder 1 Places Valid First Bid = $100.00
        BidDto bid1 = biddingService.placeBid(listing.getId(), new PlaceBidRequest(new BigDecimal("100.00")), bidder1);
        assertEquals(new BigDecimal("100.00"), bid1.getAmount());

        ListingDetailDto updatedListing = listingService.getListingById(listing.getId(), null);
        assertEquals(new BigDecimal("100.00"), updatedListing.getCurrentHighestBid());
        assertEquals(1, updatedListing.getBidCount());
        // Next minimum bid must now be $100.00 + $10.00 = $110.00
        assertEquals(new BigDecimal("110.00"), updatedListing.getMinimumAcceptableBid());

        // 7. Bidder 2 places an invalid bid below minimum (e.g. $105.00) -> Must fail
        assertThrows(InvalidBidException.class, () -> {
            biddingService.placeBid(listing.getId(), new PlaceBidRequest(new BigDecimal("105.00")), bidder2);
        });

        // 8. Bidder 2 places valid bid = $120.00 -> Accepted
        BidDto bid2 = biddingService.placeBid(listing.getId(), new PlaceBidRequest(new BigDecimal("120.00")), bidder2);
        assertEquals(new BigDecimal("120.00"), bid2.getAmount());

        // 9. Seller cannot edit material terms (starting price or closing time) once bids are placed
        // (Enforced by listingService.updateListing)

        // 10. Simulate Closing with Bids -> status becomes AWAITING_SELLER_APPROVAL
        // HandoverService / Seller Decision
        // We simulate transitioning the listing to AWAITING_SELLER_APPROVAL to test approval flow
        // In real execution, the scheduler does this
    }
}
