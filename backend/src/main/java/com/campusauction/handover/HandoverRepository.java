package com.campusauction.handover;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HandoverRepository extends JpaRepository<Handover, Long> {
    Optional<Handover> findByListingId(Long listingId);
}
