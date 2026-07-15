package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Respuesta única de la creación de una clave: es la ÚNICA vez que se devuelve el valor real. */
@Getter
@Builder
public class ApiKeyCreatedResponse {

    private UUID id;
    private String name;
    private String rawKey;
    private String keyPrefix;
    private LocalDateTime createdAt;
}
