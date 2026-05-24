package com.tingo.restaurants.application.dto.response;

import com.tingo.restaurants.domain.model.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private UserRole role;
    private boolean active;
    private boolean emailVerified;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
