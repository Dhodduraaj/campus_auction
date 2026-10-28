package com.campusauction.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByListingId(Long listingId);

    @Query("SELECT c FROM Conversation c JOIN FETCH c.listing l JOIN FETCH c.seller s JOIN FETCH c.winner w " +
           "WHERE c.seller.id = :userId OR c.winner.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c JOIN FETCH c.listing l JOIN FETCH c.seller s JOIN FETCH c.winner w " +
           "WHERE c.id = :id")
    Optional<Conversation> findByIdWithDetails(@Param("id") Long id);
}
