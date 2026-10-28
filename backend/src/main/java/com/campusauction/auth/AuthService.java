package com.campusauction.auth;

import com.campusauction.auth.dto.AuthResponse;
import com.campusauction.auth.dto.LoginRequest;
import com.campusauction.auth.dto.RegisterRequest;
import com.campusauction.common.enums.CampusVerificationStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.BadRequestException;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.security.JwtTokenProvider;
import com.campusauction.security.UserPrincipal;
import com.campusauction.user.User;
import com.campusauction.user.UserRepository;
import com.campusauction.user.dto.UserSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.campus.approved-email-domains:@campus.edu,@university.ac.in,@college.edu,*}")
    private String approvedDomainsConfig;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        // Campus domain verification check
        CampusVerificationStatus verificationStatus = determineCampusVerification(cleanEmail);

        User user = User.builder()
                .name(request.getName().trim())
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .campusVerificationStatus(verificationStatus)
                .studentId(request.getStudentId() != null ? request.getStudentId().trim() : null)
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .build();

        user = userRepository.save(user);

        // Auto authenticate after registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .user(UserSummaryDto.fromEntity(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .user(UserSummaryDto.fromEntity(user))
                .build();
    }

    @Transactional(readOnly = true)
    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BadRequestException("No authenticated student account found.");
        }

        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated student account not found in database."));
    }

    private CampusVerificationStatus determineCampusVerification(String email) {
        if (approvedDomainsConfig == null || approvedDomainsConfig.isBlank()) {
            return CampusVerificationStatus.UNVERIFIED;
        }

        List<String> domains = Arrays.stream(approvedDomainsConfig.split(","))
                .map(String::trim)
                .toList();

        if (domains.contains("*")) {
            return CampusVerificationStatus.VERIFIED;
        }

        for (String domain : domains) {
            if (email.endsWith(domain.toLowerCase())) {
                return CampusVerificationStatus.VERIFIED;
            }
        }

        return CampusVerificationStatus.UNVERIFIED;
    }
}
