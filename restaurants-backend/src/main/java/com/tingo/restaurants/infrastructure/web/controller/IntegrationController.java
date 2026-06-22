package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.application.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints expuestos para consumo por otros microservicios del ecosistema
 * (Sistema de Eventos, Hoteles, Turismo, Transporte).
 * Rol: SYSTEM_INTEGRATION con autenticación JWT de sistema.
 */
@RestController
@RequestMapping("/v1/integration")
@RequiredArgsConstructor
@Tag(name = "Integración", description = "APIs para integración con otros sistemas del ecosistema turístico")
public class IntegrationController {

    private final RestaurantService restaurantService;

    @GetMapping("/restaurants/near-event/{eventId}")
    @PreAuthorize("hasAnyRole('SYSTEM_INTEGRATION', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Restaurantes cercanos a un evento",
        description = "Endpoint para que el Sistema de Eventos consulte restaurantes disponibles " +
                      "cercanos a la ubicación de un evento específico"
    )
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> restaurantsNearEvent(
            @PathVariable UUID eventId,
            @RequestParam(defaultValue = "3.0") double radiusKm) {
        return ResponseEntity.ok(
                ApiResponse.ok(restaurantService.findNearbyEvent(eventId, radiusKm)));
    }

    @GetMapping("/restaurants/{id}/availability")
    @PreAuthorize("hasAnyRole('SYSTEM_INTEGRATION', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Disponibilidad de un restaurante",
        description = "Consultar disponibilidad y capacidad de un restaurante. " +
                      "Usado por Sistema de Hoteles para recomendar restaurantes a huéspedes"
    )
    public ResponseEntity<ApiResponse<RestaurantResponse>> getRestaurantAvailability(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findById(id)));
    }

    @GetMapping("/restaurants")
    @PreAuthorize("hasAnyRole('SYSTEM_INTEGRATION', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Catálogo de restaurantes para sistemas externos",
        description = "Expone el catálogo de restaurantes activos para integración con " +
                      "Sistema de Turismo y Sistema de Transporte"
    )
    public ResponseEntity<ApiResponse<Object>> getRestaurantsCatalog(
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                ApiResponse.ok(restaurantService.search(null, city, null, null,
                        org.springframework.data.domain.PageRequest.of(page, size))));
    }
}
