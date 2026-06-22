package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateSectionRequest {
    @NotBlank(message = "El nombre de la sección es obligatorio")
    private String name;

    private String type = "INTERIOR"; // INTERIOR | EXTERIOR | TERRAZA | BAR

    @Min(value = 0, message = "La capacidad no puede ser negativa")
    private int capacity;
}
