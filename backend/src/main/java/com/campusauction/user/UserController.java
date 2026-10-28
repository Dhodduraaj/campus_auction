package com.campusauction.user;

import com.campusauction.auth.AuthService;
import com.campusauction.common.response.ApiResponse;
import com.campusauction.common.response.PagedResponse;
import com.campusauction.listing.ListingService;
import com.campusauction.listing.dto.ListingCardDto;
import com.campusauction.notification.NotificationService;
import com.campusauction.notification.dto.NotificationDto;
import com.campusauction.user.dto.UserProfileDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@Tag(name = "Student Activity & Profile", description = "Student profile, personal listings, bids, and notifications")
public class UserController {

    private final AuthService authService;
    private final UserService userService;
    private final ListingService listingService;
    private final NotificationService notificationService;

    @GetMapping("/profile")
    @Operation(summary = "Get detailed profile of currently authenticated student")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile() {
        User user = authService.getCurrentAuthenticatedUser();
        UserProfileDto profile = userService.getUserProfile(user.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/listings")
    @Operation(summary = "Get all listings created by the authenticated student")
    public ResponseEntity<ApiResponse<PagedResponse<ListingCardDto>>> getMyListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<ListingCardDto> listings = listingService.getSellerListings(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    @GetMapping("/bids")
    @Operation(summary = "Get all auctions in which the student has placed bids")
    public ResponseEntity<ApiResponse<PagedResponse<ListingCardDto>>> getMyBids(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<ListingCardDto> listings = listingService.getListingsBidByUser(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(listings)));
    }

    @GetMapping("/notifications")
    @Operation(summary = "Get student notifications with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationDto>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationDto> notifications = notificationService.getUserNotifications(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(notifications)));
    }

    @GetMapping("/notifications/unread-count")
    @Operation(summary = "Get number of unread notifications")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadNotificationCount() {
        User user = authService.getCurrentAuthenticatedUser();
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PatchMapping("/notifications/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationDto>> markNotificationAsRead(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        NotificationDto dto = notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", dto));
    }

    @PostMapping("/notifications/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsAsRead() {
        User user = authService.getCurrentAuthenticatedUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}
