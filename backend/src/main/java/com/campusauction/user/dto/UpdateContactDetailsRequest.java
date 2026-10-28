package com.campusauction.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateContactDetailsRequest {

    @Size(max = 30, message = "Mobile number must be at most 30 characters")
    private String phoneNumber;

    @Size(max = 30, message = "WhatsApp number must be at most 30 characters")
    private String whatsappNumber;

    @Size(max = 150, message = "Campus location must be at most 150 characters")
    private String campusLocation;

    @Size(max = 255, message = "Contact note must be at most 255 characters")
    private String contactNote;
}
