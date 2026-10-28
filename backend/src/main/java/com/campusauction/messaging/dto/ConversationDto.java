package com.campusauction.messaging.dto;

import com.campusauction.common.enums.ListingStatus;
import com.campusauction.listing.Listing;
import com.campusauction.messaging.Conversation;
import com.campusauction.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
    private Long id;
    private Long listingId;
    private String listingTitle;
    private String listingThumbnailUrl;
    private BigDecimal currentPrice;
    private ListingStatus listingStatus;
    private Long sellerId;
    private String sellerName;
    private Long winnerId;
    private String winnerName;
    private String otherPartyName;
    private Long otherPartyId;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private long unreadCount;
    private MessageDto lastMessage;

    public static ConversationDto fromEntity(Conversation conversation, Long currentUserId, long unreadCount, MessageDto lastMsg) {
        if (conversation == null) return null;
        Listing listing = conversation.getListing();
        User seller = conversation.getSeller();
        User winner = conversation.getWinner();

        boolean isSeller = currentUserId != null && currentUserId.equals(seller.getId());
        String otherName = isSeller ? winner.getName() : seller.getName();
        Long otherId = isSeller ? winner.getId() : seller.getId();

        String thumb = null;
        if (listing != null && listing.getImages() != null && !listing.getImages().isEmpty()) {
            thumb = listing.getImages().get(0).getImageUrl();
        }

        return ConversationDto.builder()
                .id(conversation.getId())
                .listingId(listing != null ? listing.getId() : null)
                .listingTitle(listing != null ? listing.getTitle() : null)
                .listingThumbnailUrl(thumb)
                .currentPrice(listing != null ? listing.getCurrentHighestBid() : null)
                .listingStatus(listing != null ? listing.getStatus() : null)
                .sellerId(seller.getId())
                .sellerName(seller.getName())
                .winnerId(winner.getId())
                .winnerName(winner.getName())
                .otherPartyName(otherName)
                .otherPartyId(otherId)
                .status(conversation.getStatus())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .unreadCount(unreadCount)
                .lastMessage(lastMsg)
                .build();
    }
}
