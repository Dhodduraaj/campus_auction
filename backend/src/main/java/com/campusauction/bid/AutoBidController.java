package com.campusauction.bid;

import com.campusauction.auth.AuthService;
import com.campusauction.bid.dto.ActivateAutoBidRequest;
import com.campusauction.bid.dto.AutoBidRuleDto;
import com.campusauction.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings/{listingId}/auto-bid")
@RequiredArgsConstructor
public class AutoBidController {

    private final AutoBidService autoBidService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    public ResponseEntity<AutoBidRuleDto> activateOrUpdate(
            @PathVariable Long listingId,
            @Valid @RequestBody ActivateAutoBidRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.activateOrUpdate(listingId, request, currentUser);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AutoBidRuleDto> getMyRule(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return autoBidService.getMyRule(listingId, currentUser)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/pause")
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    public ResponseEntity<AutoBidRuleDto> pause(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.pauseRule(listingId, currentUser);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/resume")
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    public ResponseEntity<AutoBidRuleDto> resume(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.resumeRule(listingId, currentUser);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('JUNIOR', 'ADMIN')")
    public ResponseEntity<AutoBidRuleDto> cancel(@PathVariable Long listingId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        AutoBidRuleDto dto = autoBidService.cancelRule(listingId, currentUser);
        return ResponseEntity.ok(dto);
    }
}
