package com.tingo.restaurants.domain.model;

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
public class ApiKey {

    private UUID id;
    private UUID userId;
    private String name;
    private String keyPrefix;
    private String keyHash;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    private LocalDateTime revokedAt;

    public boolean isRevoked() {
        return revokedAt != null;
    }
}
