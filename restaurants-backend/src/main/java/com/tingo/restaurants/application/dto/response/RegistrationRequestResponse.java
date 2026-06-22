package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Solicitud de cuenta de restaurante pendiente de revisión por el admin. */
@Getter
@Builder
public class RegistrationRequestResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String phone;
    private String accountStatus;
    private LocalDateTime requestedAt;
    private List<RestaurantResponse> restaurants;
}
