package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Listado de claves: nunca incluye la clave real, solo el prefijo no-secreto. */
@Getter
@Builder
public class ApiKeyResponse {

    private UUID id;
    private String name;
    private String keyPrefix;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    private boolean revoked;
}
