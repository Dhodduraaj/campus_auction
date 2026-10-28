package com.campusauction;

import com.campusauction.bid.BiddingService;
import com.campusauction.bid.dto.PlaceBidRequest;
import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.InvalidBidException;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingRepository;
import com.campusauction.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class BiddingEngineTests {

    @Autowired
    private BiddingService biddingService;

    @Autowired
    private ListingRepository listingRepository;

    private User seller;
    private User bidder1;
    private User bidder2;
    private Listing openAuction;

    @BeforeEach
    void setUp() {
        // Prepare test data
        seller = User.builder()
                .name("Senior Student")
                .email("seller@campus.edu")
                .passwordHash("hashed")
                .role(Role.SENIOR)
                .build();

        bidder1 = User.builder()
                .name("Junior Bidder 1")
                .email("bidder1@campus.edu")
                .passwordHash("hashed")
                .role(Role.JUNIOR)
                .build();

        bidder2 = User.builder()
                .name("Junior Bidder 2")
                .email("bidder2@campus.edu")
                .passwordHash("hashed")
                .role(Role.JUNIOR)
                .build();

        openAuction = Listing.builder()
                .seller(seller)
                .title("Scientific Calculator FX-991EX")
                .category(ListingCategory.CALCULATOR)
                .condition(ItemCondition.LIKE_NEW)
                .description("Advanced engineering calculator in perfect condition.")
                .startingPrice(new BigDecimal("50.00"))
                .minimumBidIncrement(new BigDecimal("5.00"))
                .currentHighestBid(new BigDecimal("50.00"))
                .bidCount(0)
                .closingAt(OffsetDateTime.now().plusDays(2))
                .status(ListingStatus.OPEN)
                .build();
    }

    @Test
    @DisplayName("Starting price is minimum acceptable bid when no bids exist")
    void testFirstBidAcceptance() {
        assertEquals(new BigDecimal("50.00"), openAuction.getMinimumAcceptableBid());
    }

    @Test
    @DisplayName("Minimum acceptable bid equals current highest bid + increment once bids exist")
    void testSubsequentBidRule() {
        openAuction.setBidCount(1);
        openAuction.setCurrentHighestBid(new BigDecimal("55.00"));
        assertEquals(new BigDecimal("60.00"), openAuction.getMinimumAcceptableBid());
    }

    @Test
    @DisplayName("Auction expiration is correctly evaluated against UTC timestamps")
    void testAuctionExpirationCheck() {
        assertFalse(openAuction.isExpired(OffsetDateTime.now()));

        openAuction.setClosingAt(OffsetDateTime.now().minusMinutes(1));
        assertTrue(openAuction.isExpired(OffsetDateTime.now()));
    }
}
