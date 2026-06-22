package com.tingo.restaurants.domain.model.enums;

/**
 * Proveedor de identidad de un usuario.
 * LOCAL  → email + contraseña (ADMIN, RESTAURANTE_OWNER).
 * GOOGLE → inicio de sesión con Google OAuth (CLIENTE).
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
