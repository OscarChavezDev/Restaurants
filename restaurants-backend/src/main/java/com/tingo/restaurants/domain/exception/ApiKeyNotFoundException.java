package com.tingo.restaurants.domain.exception;

import java.util.UUID;

public class ApiKeyNotFoundException extends DomainException {

    public ApiKeyNotFoundException(UUID id) {
        super("API key no encontrada con ID: " + id, "API_KEY_NOT_FOUND");
    }
}
