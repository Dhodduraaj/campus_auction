package com.campusauction.bid;

import com.campusauction.common.enums.AutoBidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutoBidRuleRepository extends JpaRepository<AutoBidRule, Long> {

    Optional<AutoBidRule> findByListingIdAndBuyerId(Long listingId, Long buyerId);

    List<AutoBidRule> findByListingIdAndStatus(Long listingId, AutoBidStatus status);

    List<AutoBidRule> findByListingId(Long listingId);

    List<AutoBidRule> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
}
