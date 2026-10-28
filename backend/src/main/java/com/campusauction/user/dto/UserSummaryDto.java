package com.campusauction.user.dto;

import com.campusauction.common.enums.CampusVerificationStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
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

    public static UserSummaryDto fromEntity(User user) {
        if (user == null) return null;
        return UserSummaryDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .campusVerificationStatus(user.getCampusVerificationStatus())
                .studentId(user.getStudentId())
                .phoneNumber(user.getPhoneNumber())
                .whatsappNumber(user.getWhatsappNumber())
                .campusLocation(user.getCampusLocation())
                .contactNote(user.getContactNote())
                .build();
    }
}
