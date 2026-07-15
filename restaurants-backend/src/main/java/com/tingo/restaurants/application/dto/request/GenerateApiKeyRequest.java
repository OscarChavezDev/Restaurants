package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GenerateApiKeyRequest {

    @NotBlank(message = "El nombre de la clave es obligatorio")
    @Size(min = 2, max = 150)
    private String name;
}
