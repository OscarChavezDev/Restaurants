package com.tingo.restaurants.domain.exception;

/** Demasiados intentos fallidos de inicio de sesión (rate limiting). */
public class TooManyAttemptsException extends RuntimeException {
    public TooManyAttemptsException(String message) {
        super(message);
    }
}
