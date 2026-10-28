package com.campusauction.handover.dto;

import com.campusauction.common.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverContactDto {
    private Long userId;
    private String name;
    private String email;
    private String phoneNumber;
    private Role role;
    private Long conversationId;
    private String campusHandoverGuide;
}
