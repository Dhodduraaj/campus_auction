package com.campusauction.listing;

import com.campusauction.common.enums.ListingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Listing l WHERE l.id = :id")
    Optional<Listing> findByIdWithPessimisticLock(@Param("id") Long id);

    List<Listing> findByStatusAndClosingAtLessThanEqual(ListingStatus status, OffsetDateTime closingAt);

    List<Listing> findByStatusOrderByClosingAtAsc(ListingStatus status);

    Page<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    Page<Listing> findBySellerIdAndStatusIn(Long sellerId, List<ListingStatus> statuses, Pageable pageable);

    long countBySellerIdAndStatus(Long sellerId, ListingStatus status);

    @Query("SELECT DISTINCT l FROM Listing l JOIN Bid b ON b.listing = l WHERE b.bidder.id = :bidderId ORDER BY l.closingAt DESC")
    Page<Listing> findListingsBidByUser(@Param("bidderId") Long bidderId, Pageable pageable);

    @Query("SELECT DISTINCT l FROM Listing l WHERE l.leadingBidder.id = :userId AND l.status IN :statuses ORDER BY l.closedAt DESC NULLS LAST, l.updatedAt DESC")
    Page<Listing> findWonListingsByUser(@Param("userId") Long userId, @Param("statuses") List<ListingStatus> statuses, Pageable pageable);
}

