package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cuerpo del login con Google: el frontend obtiene el ID token con Google
 * Identity Services y lo envía aquí para que el backend lo verifique.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {

    @NotBlank(message = "El token de Google es obligatorio")
    private String idToken;
}
