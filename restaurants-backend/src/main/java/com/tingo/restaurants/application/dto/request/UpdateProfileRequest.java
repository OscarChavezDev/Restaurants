package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateProfileRequest {

    @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres")
    private String fullName;

    @Pattern(regexp = "^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$",
             message = "Formato de teléfono inválido")
    private String phone;

    private String currentPassword;

    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
             message = "La contraseña debe contener mayúsculas, minúsculas, número y carácter especial")
    private String newPassword;
}
