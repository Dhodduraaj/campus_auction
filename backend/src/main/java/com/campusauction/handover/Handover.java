package com.campusauction.handover;

import com.campusauction.listing.Listing;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "handovers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Handover {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    private Listing listing;

    @Column(name = "seller_confirmation", nullable = false)
    @Builder.Default
    private Boolean sellerConfirmation = false;

    @Column(name = "winner_confirmation", nullable = false)
    @Builder.Default
    private Boolean winnerConfirmation = false;

    @Column(name = "seller_confirmed_at")
    private OffsetDateTime sellerConfirmedAt;

    @Column(name = "winner_confirmed_at")
    private OffsetDateTime winnerConfirmedAt;

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String outcome = "PENDING";

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
