package com.campusauction;

import com.campusauction.bid.AutoBidRule;
import com.campusauction.bid.AutoBidRuleRepository;
import com.campusauction.bid.AutoBidService;
import com.campusauction.bid.BiddingService;
import com.campusauction.bid.dto.ActivateAutoBidRequest;
import com.campusauction.bid.dto.AutoBidRuleDto;
import com.campusauction.bid.dto.PlaceBidRequest;
import com.campusauction.common.enums.AutoBidStatus;
import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.InvalidBidException;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingRepository;
import com.campusauction.user.User;
import com.campusauction.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AutoBiddingTests {

    @Autowired
    private AutoBidService autoBidService;

    @Autowired
    private BiddingService biddingService;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AutoBidRuleRepository autoBidRuleRepository;

    private User seller;
    private User buyerA;
    private User buyerB;
    private Listing cycleAuction;

    @BeforeEach
    void setUp() {
        seller = userRepository.save(User.builder()
                .name("Rohan Senior")
                .email("seller_auto_" + System.currentTimeMillis() + "@campus.edu")
                .passwordHash("hashed")
                .role(Role.SENIOR)
                .build());

        buyerA = userRepository.save(User.builder()
                .name("Buyer A")
                .email("buyerA_" + System.currentTimeMillis() + "@campus.edu")
                .passwordHash("hashed")
                .role(Role.JUNIOR)
                .build());

        buyerB = userRepository.save(User.builder()
                .name("Buyer B")
                .email("buyerB_" + System.currentTimeMillis() + "@campus.edu")
                .passwordHash("hashed")
                .role(Role.JUNIOR)
                .build());

        cycleAuction = listingRepository.save(Listing.builder()
                .seller(seller)
                .title("Campus Mountain Cycle")
                .category(ListingCategory.CYCLE)
                .condition(ItemCondition.GOOD)
                .description("Sturdy 21-speed geared bicycle.")
                .startingPrice(new BigDecimal("1000.00"))
                .minimumBidIncrement(new BigDecimal("100.00"))
                .currentHighestBid(new BigDecimal("1000.00"))
                .bidCount(0)
                .closingAt(OffsetDateTime.now().plusDays(2))
                .status(ListingStatus.OPEN)
                .build());
    }

    @Test
    @DisplayName("1. Activate automatic bidding places the initial opening bid")
    void testActivateAutoBidInitialOpening() {
        // Buyer B activates proxy with max 1800 on empty auction
        AutoBidRuleDto rule = autoBidService.activateOrUpdate(
                cycleAuction.getId(),
                new ActivateAutoBidRequest(new BigDecimal("1800.00")),
                buyerB
        );

        assertNotNull(rule);
        assertEquals(AutoBidStatus.ACTIVE, rule.getStatus());
        assertEquals(new BigDecimal("1800.00"), rule.getMaxAmount());

        Listing updated = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(new BigDecimal("1000.00"), updated.getCurrentHighestBid(), "First proxy bid should take starting price");
        assertEquals(buyerB.getId(), updated.getLeadingBidder().getId());
        assertEquals(1, updated.getBidCount());
    }

    @Test
    @DisplayName("2. Reject activation when maximum is below minimum acceptable bid")
    void testRejectBelowMinimumAcceptable() {
        assertThrows(InvalidBidException.class, () -> {
            autoBidService.activateOrUpdate(
                    cycleAuction.getId(),
                    new ActivateAutoBidRequest(new BigDecimal("800.00")),
                    buyerB
            );
        });
    }

    @Test
    @DisplayName("3. Seller cannot activate automatic bidding on own listing")
    void testSellerCannotAutoBid() {
        assertThrows(ForbiddenException.class, () -> {
            autoBidService.activateOrUpdate(
                    cycleAuction.getId(),
                    new ActivateAutoBidRequest(new BigDecimal("1500.00")),
                    seller
            );
        });
    }

    @Test
    @DisplayName("4. Competing manual bid triggers automatic counterbid up to maximum")
    void testCompetingManualBidTriggersAutoCounterbid() {
        // Buyer A manually bids 1200
        PlaceBidRequest manualBid = new PlaceBidRequest();
        manualBid.setAmount(new BigDecimal("1200.00"));
        biddingService.placeBid(cycleAuction.getId(), manualBid, buyerA);

        Listing afterManual = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(new BigDecimal("1200.00"), afterManual.getCurrentHighestBid());
        assertEquals(buyerA.getId(), afterManual.getLeadingBidder().getId());

        // Buyer B activates proxy with max 1800
        autoBidService.activateOrUpdate(
                cycleAuction.getId(),
                new ActivateAutoBidRequest(new BigDecimal("1800.00")),
                buyerB
        );

        // Buyer B should immediately take lead at 1200 + 100 = 1300
        Listing afterProxy = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(new BigDecimal("1300.00"), afterProxy.getCurrentHighestBid());
        assertEquals(buyerB.getId(), afterProxy.getLeadingBidder().getId());

        // Buyer A manually bids 1400
        manualBid.setAmount(new BigDecimal("1400.00"));
        biddingService.placeBid(cycleAuction.getId(), manualBid, buyerA);

        // Buyer B's proxy should automatically respond with 1500
        Listing afterCounter = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(new BigDecimal("1500.00"), afterCounter.getCurrentHighestBid());
        assertEquals(buyerB.getId(), afterCounter.getLeadingBidder().getId());
    }

    @Test
    @DisplayName("5. Automatic bidding stops and marks OUTBID when price exceeds maximum")
    void testAutoBidStopsWhenExceeded() {
        // Buyer B activates proxy with max 1500
        autoBidService.activateOrUpdate(
                cycleAuction.getId(),
                new ActivateAutoBidRequest(new BigDecimal("1500.00")),
                buyerB
        );

        // Buyer A manually bids 1600 (exceeds Buyer B's 1500 limit)
        PlaceBidRequest manualBid = new PlaceBidRequest();
        manualBid.setAmount(new BigDecimal("1600.00"));
        biddingService.placeBid(cycleAuction.getId(), manualBid, buyerA);

        Listing listing = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(new BigDecimal("1600.00"), listing.getCurrentHighestBid());
        assertEquals(buyerA.getId(), listing.getLeadingBidder().getId());

        AutoBidRule ruleB = autoBidRuleRepository.findByListingIdAndBuyerId(cycleAuction.getId(), buyerB.getId()).orElseThrow();
        assertEquals(AutoBidStatus.OUTBID, ruleB.getStatus());
    }

    @Test
    @DisplayName("6. Paused rule does not place counterbids")
    void testPausedRuleDoesNotBid() {
        autoBidService.activateOrUpdate(
                cycleAuction.getId(),
                new ActivateAutoBidRequest(new BigDecimal("2000.00")),
                buyerB
        );

        // Buyer B pauses
        autoBidService.pauseRule(cycleAuction.getId(), buyerB);

        // Buyer A manually bids 1200
        PlaceBidRequest manualBid = new PlaceBidRequest();
        manualBid.setAmount(new BigDecimal("1200.00"));
        biddingService.placeBid(cycleAuction.getId(), manualBid, buyerA);

        Listing listing = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(new BigDecimal("1200.00"), listing.getCurrentHighestBid());
        assertEquals(buyerA.getId(), listing.getLeadingBidder().getId(), "Buyer A should keep lead because Buyer B is paused");
    }

    @Test
    @DisplayName("7. Tied maximums follow deterministic earliest registration priority")
    void testTiedMaximumsTieBreaker() {
        // Buyer A configures proxy max 1500 first
        autoBidService.activateOrUpdate(
                cycleAuction.getId(),
                new ActivateAutoBidRequest(new BigDecimal("1500.00")),
                buyerA
        );

        // Buyer B configures proxy max 1500 second
        autoBidService.activateOrUpdate(
                cycleAuction.getId(),
                new ActivateAutoBidRequest(new BigDecimal("1500.00")),
                buyerB
        );

        Listing listing = listingRepository.findById(cycleAuction.getId()).orElseThrow();
        assertEquals(buyerA.getId(), listing.getLeadingBidder().getId(), "Buyer A registered first and must win the tie");
        assertEquals(new BigDecimal("1500.00"), listing.getCurrentHighestBid());

        AutoBidRule ruleB = autoBidRuleRepository.findByListingIdAndBuyerId(cycleAuction.getId(), buyerB.getId()).orElseThrow();
        assertEquals(AutoBidStatus.OUTBID, ruleB.getStatus(), "Buyer B was outbid by earlier registered equal max");
    }
}
