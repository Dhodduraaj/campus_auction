package com.campusauction.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender s WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    List<Message> findAllByConversationIdOrderByCreatedAtAsc(@Param("conversationId") Long conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.sender.id <> :userId AND m.readAt IS NULL")
    long countUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.readAt = :now WHERE m.conversation.id = :conversationId AND m.sender.id <> :userId AND m.readAt IS NULL")
    int markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId, @Param("now") OffsetDateTime now);
}
