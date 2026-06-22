package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.ReservationConfigRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.ReservationConfigResponse;
import com.tingo.restaurants.application.service.ReservationConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/restaurants/{restaurantId}/reservation-config")
@RequiredArgsConstructor
@Tag(name = "Config de reservas", description = "Reglas de reserva por restaurante (Sprint 10)")
public class ReservationConfigController {

    private final ReservationConfigService service;

    @GetMapping
    @Operation(summary = "Obtener la config de reservas del restaurante (pública)")
    public ResponseEntity<ApiResponse<ReservationConfigResponse>> get(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByRestaurant(restaurantId)));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Guardar la config de reservas (solo dueño del restaurante)")
    public ResponseEntity<ApiResponse<ReservationConfigResponse>> save(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody ReservationConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Configuración guardada", service.save(restaurantId, request)));
    }
}
