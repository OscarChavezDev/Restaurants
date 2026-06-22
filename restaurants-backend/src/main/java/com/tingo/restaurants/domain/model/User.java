package com.tingo.restaurants.domain.model;

import com.tingo.restaurants.domain.model.enums.AccountStatus;
import com.tingo.restaurants.domain.model.enums.AuthProvider;
import com.tingo.restaurants.domain.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private UUID id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String phone;
    private UserRole role;
    private AuthProvider provider;
    private String googleId;
    private boolean isActive;
    private AccountStatus accountStatus;
    private boolean emailVerified;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean isRestaurantOwner() {
        return role == UserRole.RESTAURANTE_OWNER;
    }

    public boolean canManageRestaurant() {
        return role == UserRole.ADMIN || role == UserRole.RESTAURANTE_OWNER;
    }
}
