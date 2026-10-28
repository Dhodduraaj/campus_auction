package com.campusauction.auction;

import com.campusauction.common.enums.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuctionOutcomeRepository extends JpaRepository<AuctionOutcome, Long> {
    Optional<AuctionOutcome> findByListingId(Long listingId);
    boolean existsByListingId(Long listingId);
    long countByProvisionalWinnerIdAndFinalStatus(Long provisionalWinnerId, ListingStatus finalStatus);
}
