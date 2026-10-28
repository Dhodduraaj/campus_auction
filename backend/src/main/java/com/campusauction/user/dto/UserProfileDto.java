package com.campusauction.user.dto;

import com.campusauction.common.enums.CampusVerificationStatus;
import com.campusauction.common.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private CampusVerificationStatus campusVerificationStatus;
    private String studentId;
    private String phoneNumber;
    private String whatsappNumber;
    private String campusLocation;
    private String contactNote;
    private OffsetDateTime createdAt;
    private long totalListingsCount;
    private long activeListingsCount;
    private long totalBidsPlacedCount;
    private long auctionsWonCount;
}
