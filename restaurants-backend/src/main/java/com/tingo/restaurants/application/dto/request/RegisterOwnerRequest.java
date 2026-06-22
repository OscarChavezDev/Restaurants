package com.tingo.restaurants.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Solicitud de cuenta de restaurante. Crea al dueño en estado PENDING_REVIEW
 * y su restaurante en PENDING_APPROVAL; el admin debe aprobarla.
 */
@Getter
@Setter
@NoArgsConstructor
public class RegisterOwnerRequest {

    // ── Datos del dueño ──────────────────────────────────────────────
    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(min = 2, max = 150)
    private String fullName;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
             message = "La contraseña debe contener mayúsculas, minúsculas, número y carácter especial")
    private String password;

    @Pattern(regexp = "^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$",
             message = "Formato de teléfono inválido")
    private String phone;

    // ── Datos del restaurante ────────────────────────────────────────
    @NotNull(message = "Los datos del restaurante son obligatorios")
    @Valid
    private CreateRestaurantRequest restaurant;
}
