package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateTableRequest {
    @Min(value = 1, message = "La capacidad mínima es 1")
    private int capacity;
}
