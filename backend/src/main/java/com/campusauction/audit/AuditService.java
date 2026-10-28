package com.campusauction.audit;

import com.campusauction.listing.Listing;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    @Transactional
    public void recordEvent(Listing listing, User actor, String eventType, String details) {
        try {
            AuditEvent event = AuditEvent.builder()
                    .listing(listing)
                    .actor(actor)
                    .eventType(eventType)
                    .eventDetails(details)
                    .build();
            auditEventRepository.save(event);
        } catch (Exception e) {
            // Audit logging failure should not crash primary transaction
        }
    }
}
