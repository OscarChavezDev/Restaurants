package com.tingo.restaurants.domain.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class OwnerAlreadyHasRestaurantException extends RuntimeException {
    public OwnerAlreadyHasRestaurantException(String message) {
        super(message);
    }
}
