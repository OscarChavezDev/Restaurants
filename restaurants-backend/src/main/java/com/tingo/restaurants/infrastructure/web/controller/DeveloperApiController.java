package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.DailyStatusResponse;
import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.application.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Catálogo de restaurantes de solo lectura para el portal de desarrollador
 * autoservicio: registro en /v1/auth/register-developer, API key generada en
 * /v1/developer/api-keys, autenticación acá vía el header X-API-Key
 * (ApiKeyAuthenticationFilter). No usa JWT — a diferencia de /v1/integration,
 * pensado para socios ya verificados por un admin (rol SYSTEM_INTEGRATION).
 */
@RestController
@RequestMapping("/v1/developer-api")
@RequiredArgsConstructor
@Tag(name = "Developer API", description = "Catálogo de restaurantes para desarrolladores externos autenticados con API key")
public class DeveloperApiController {

    private final RestaurantService restaurantService;

    @GetMapping("/restaurants")
    @PreAuthorize("hasRole('DEVELOPER')")
    @SecurityRequirement(name = "apiKeyAuth")
    @Operation(
        summary = "Catálogo de restaurantes",
        description = "Lista paginada de restaurantes activos, incluyendo ubicación (latitud/longitud)."
    )
    public ResponseEntity<ApiResponse<Object>> listRestaurants(
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                ApiResponse.ok(restaurantService.search(null, city, null, null, PageRequest.of(page, size))));
    }

    @GetMapping("/restaurants/{id}")
    @PreAuthorize("hasRole('DEVELOPER')")
    @SecurityRequirement(name = "apiKeyAuth")
    @Operation(
        summary = "Detalle de un restaurante",
        description = "Datos completos de un restaurante: ubicación, capacidad, horarios, calificación, etc."
    )
    public ResponseEntity<ApiResponse<RestaurantResponse>> getRestaurant(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findById(id)));
    }

    @GetMapping("/restaurants/{id}/daily-status")
    @PreAuthorize("hasRole('DEVELOPER')")
    @SecurityRequirement(name = "apiKeyAuth")
    @Operation(
        summary = "Estado operativo de hoy: horario, si está abierto, mesas libres y menú",
        description = "Pensado para generadores de itinerarios: si conviene programar este " +
                      "restaurante como parada de almuerzo/cena ahora mismo — horario de hoy, " +
                      "si está abierto, mesas/cupos libres y el menú con disponibilidad por plato."
    )
    public ResponseEntity<ApiResponse<DailyStatusResponse>> getDailyStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.getDailyStatus(id)));
    }
}
