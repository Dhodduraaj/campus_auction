package com.campusauction.notification.dto;

import com.campusauction.common.enums.NotificationType;
import com.campusauction.notification.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private NotificationType eventType;
    private String title;
    private String message;
    private Long relatedListingId;
    private OffsetDateTime createdAt;
    private OffsetDateTime readAt;

    public static NotificationDto fromEntity(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .eventType(notification.getEventType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedListingId(notification.getRelatedListing() != null ? notification.getRelatedListing().getId() : null)
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
