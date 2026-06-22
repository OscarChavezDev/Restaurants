package com.tingo.restaurants.domain.exception;

/**
 * La cuenta existe y las credenciales son correctas, pero no está activa
 * (en revisión por el admin o rechazada). Se traduce a HTTP 403.
 */
public class AccountNotActiveException extends DomainException {

    public AccountNotActiveException(String message, String errorCode) {
        super(message, errorCode);
    }
}
