package com.campusauction.bid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByListingIdOrderByCreatedAtDesc(Long listingId);

    Page<Bid> findByBidderIdOrderByCreatedAtDesc(Long bidderId, Pageable pageable);

    Optional<Bid> findFirstByListingIdOrderByAmountDescCreatedAtAsc(Long listingId);

    long countByListingId(Long listingId);
}
