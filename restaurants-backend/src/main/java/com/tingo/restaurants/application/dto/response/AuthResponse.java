package com.tingo.restaurants.application.dto.response;

import com.tingo.restaurants.domain.model.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class AuthResponse {

    private UUID userId;
    private String fullName;
    private String email;
    private UserRole role;
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType;
    private java.time.LocalDateTime createdAt;
}
