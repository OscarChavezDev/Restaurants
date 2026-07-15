package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro autoservicio de una cuenta de desarrollador (rol DEVELOPER).
 * Sin campo de rol: se fija en el servidor para que nadie pueda auto-asignarse otro rol.
 * Activación inmediata, sin revisión de un admin.
 */
@Getter
@Setter
@NoArgsConstructor
public class RegisterDeveloperRequest {

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
}
