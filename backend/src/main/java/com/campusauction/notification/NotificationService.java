package com.campusauction.notification;

import com.campusauction.common.enums.NotificationType;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.listing.Listing;
import com.campusauction.notification.dto.NotificationDto;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createNotification(User recipient, NotificationType eventType, String title, String message, Listing listing) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .eventType(eventType)
                .title(title)
                .message(message)
                .relatedListing(listing)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Push real-time notification to user's private topic via WebSocket STOMP
        try {
            NotificationDto dto = NotificationDto.fromEntity(saved);
            messagingTemplate.convertAndSend("/topic/notifications/" + recipient.getId(), dto);
        } catch (Exception e) {
            log.warn("Could not push live WebSocket notification to user {}: {}", recipient.getId(), e.getMessage());
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return NotificationDto.fromEntity(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, OffsetDateTime.now());
    }
}
