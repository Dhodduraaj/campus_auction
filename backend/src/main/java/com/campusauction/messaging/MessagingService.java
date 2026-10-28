package com.campusauction.messaging;

import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.exception.BadRequestException;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingRepository;
import com.campusauction.messaging.dto.ConversationDto;
import com.campusauction.messaging.dto.MessageDto;
import com.campusauction.messaging.dto.SendMessageRequest;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Conversation getOrCreateConversationForListing(Long listingId, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found: " + listingId));

        // Allowed only once approved / reserved or completed / sold
        if (listing.getStatus() != ListingStatus.RESERVED &&
            listing.getStatus() != ListingStatus.COMPLETED &&
            listing.getStatus() != ListingStatus.SOLD) {
            throw new BadRequestException("Messaging is only available after the winning bid is approved and item is reserved.");
        }

        boolean isSeller = listing.getSeller().getId().equals(currentUser.getId());
        boolean isWinner = listing.getLeadingBidder() != null && listing.getLeadingBidder().getId().equals(currentUser.getId());

        if (!isSeller && !isWinner) {
            throw new ForbiddenException("Only the seller and the winning bidder can access the transaction conversation.");
        }

        return conversationRepository.findByListingId(listingId)
                .orElseGet(() -> {
                    Conversation conv = Conversation.builder()
                            .listing(listing)
                            .seller(listing.getSeller())
                            .winner(listing.getLeadingBidder())
                            .status("ACTIVE")
                            .build();
                    return conversationRepository.save(conv);
                });
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationDtoByListingId(Long listingId, User currentUser) {
        Conversation conv = getOrCreateConversationForListing(listingId, currentUser);
        return toDto(conv, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationById(Long conversationId, User currentUser) {
        Conversation conv = conversationRepository.findByIdWithDetails(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateParticipant(conv, currentUser.getId());
        return toDto(conv, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(User currentUser) {
        List<Conversation> conversations = conversationRepository.findAllByUserId(currentUser.getId());
        List<ConversationDto> result = new ArrayList<>();
        for (Conversation conv : conversations) {
            result.add(toDto(conv, currentUser.getId()));
        }
        return result;
    }

    @Transactional
    public List<MessageDto> getMessages(Long conversationId, User currentUser) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateParticipant(conv, currentUser.getId());

        // Mark incoming messages as read
        messageRepository.markMessagesAsRead(conversationId, currentUser.getId(), OffsetDateTime.now());

        List<Message> messages = messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conversationId);
        return messages.stream()
                .map(m -> MessageDto.fromEntity(m, currentUser.getId()))
                .toList();
    }

    @Transactional
    public MessageDto sendMessage(Long conversationId, SendMessageRequest request, User sender) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        validateParticipant(conv, sender.getId());

        String content = request.getContent() != null ? request.getContent().trim() : "";
        if (content.isEmpty()) {
            throw new BadRequestException("Message cannot be empty.");
        }

        Message message = Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(content)
                .build();

        Message saved = messageRepository.save(message);
        conv.setUpdatedAt(OffsetDateTime.now());
        conversationRepository.save(conv);

        MessageDto dto = MessageDto.fromEntity(saved, sender.getId());

        // Real-time broadcast to topic for this conversation
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
        } catch (Exception ignored) {}

        return dto;
    }

    private void validateParticipant(Conversation conversation, Long userId) {
        boolean isSeller = conversation.getSeller().getId().equals(userId);
        boolean isWinner = conversation.getWinner().getId().equals(userId);

        if (!isSeller && !isWinner) {
            throw new ForbiddenException("Access denied: You are not a participant in this conversation.");
        }
    }

    private ConversationDto toDto(Conversation conv, Long currentUserId) {
        long unread = messageRepository.countUnreadMessages(conv.getId(), currentUserId);
        List<Message> msgs = messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conv.getId());
        MessageDto lastMsg = msgs.isEmpty() ? null : MessageDto.fromEntity(msgs.get(msgs.size() - 1), currentUserId);
        return ConversationDto.fromEntity(conv, currentUserId, unread, lastMsg);
    }
}
