package com.campusauction.messaging.dto;

import com.campusauction.messaging.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String content;
    private OffsetDateTime createdAt;
    private OffsetDateTime readAt;
    private boolean isMine;

    public static MessageDto fromEntity(Message message, Long currentUserId) {
        if (message == null) return null;
        return MessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .readAt(message.getReadAt())
                .isMine(currentUserId != null && currentUserId.equals(message.getSender().getId()))
                .build();
    }
}
