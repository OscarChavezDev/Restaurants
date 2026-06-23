package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRatingRequest {

    private UUID reservationId;

    private UUID restaurantId;

    @NotNull(message = "La puntuación es obligatoria")
    @Min(value = 1, message = "La puntuación mínima es 1")
    @Max(value = 5, message = "La puntuación máxima es 5")
    private Integer score;

    @Size(max = 1000, message = "El comentario no puede exceder los 1000 caracteres")
    private String comment;

    @Min(value = 1, message = "La puntuación mínima de comida es 1")
    @Max(value = 5, message = "La puntuación máxima de comida es 5")
    private Integer foodScore;

    @Min(value = 1, message = "La puntuación mínima de servicio es 1")
    @Max(value = 5, message = "La puntuación máxima de servicio es 5")
    private Integer serviceScore;

    @Min(value = 1, message = "La puntuación mínima de ambiente es 1")
    @Max(value = 5, message = "La puntuación máxima de ambiente es 5")
    private Integer ambianceScore;
}
