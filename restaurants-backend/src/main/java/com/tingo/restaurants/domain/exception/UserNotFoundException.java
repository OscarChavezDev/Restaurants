package com.tingo.restaurants.domain.exception;

import java.util.UUID;

public class UserNotFoundException extends DomainException {

    public UserNotFoundException(UUID id) {
        super("Usuario no encontrado con ID: " + id, "USER_NOT_FOUND");
    }
}
