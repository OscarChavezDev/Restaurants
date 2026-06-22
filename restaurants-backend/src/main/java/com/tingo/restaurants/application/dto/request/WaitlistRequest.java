package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** Anotarse en lista de espera (Sprint 11, S11-05). */
@Data
public class WaitlistRequest {

    @NotNull
    private UUID restaurantId;

    @NotBlank
    private String customerName;

    @Email
    private String customerEmail;

    @NotBlank
    private String customerPhone;

    @NotNull
    @FutureOrPresent
    private LocalDate reservationDate;

    private LocalTime startTime;

    @Min(1) @Max(500)
    private int partySize;
}
