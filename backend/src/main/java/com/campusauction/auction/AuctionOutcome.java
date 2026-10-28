package com.campusauction.auction;

import com.campusauction.bid.Bid;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.listing.Listing;
import com.campusauction.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "auction_outcomes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provisional_winner_id")
    private User provisionalWinner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winning_bid_id")
    private Bid winningBid;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_status", nullable = false, length = 40)
    private ListingStatus finalStatus;

    @Column(name = "seller_decision", length = 30)
    private String sellerDecision;

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionReason;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
