package com.tingo.restaurants.infrastructure.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.tingo.restaurants.domain.exception.InvalidCredentialsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Verifica el ID token que envía el frontend tras el login con Google.
 * Valida la firma (con los certificados públicos de Google), la expiración
 * y que el "audience" coincida con nuestro Client ID. Si todo es correcto,
 * devuelve el payload con email, nombre y "sub" del usuario.
 */
@Slf4j
@Component
public class GoogleTokenVerifier {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${google.oauth.client-id:}") String clientId) {
        this.clientId = clientId;
        this.verifier = StringUtils.hasText(clientId)
                ? new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(Collections.singletonList(clientId))
                        .build()
                : null;
    }

    public GoogleIdToken.Payload verify(String idTokenString) {
        if (verifier == null) {
            log.error("Login con Google no configurado: falta GOOGLE_CLIENT_ID en el entorno.");
            throw new IllegalStateException("El inicio de sesión con Google no está configurado en el servidor.");
        }
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                log.warn("ID token de Google inválido o no verificable.");
                throw new InvalidCredentialsException();
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            // IllegalArgumentException: token malformado (no es un JWT válido)
            log.warn("Error verificando el ID token de Google: {}", e.getMessage());
            throw new InvalidCredentialsException();
        }
    }
}
