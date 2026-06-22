package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateTableRequest {
    @NotBlank(message = "El número/nombre de la mesa es obligatorio")
    private String tableNumber;

    @Min(value = 1, message = "La capacidad mínima es 1")
    private int capacity = 2;

    private UUID sectionId;
}
