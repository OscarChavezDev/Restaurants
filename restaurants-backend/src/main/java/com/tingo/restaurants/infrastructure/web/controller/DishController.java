package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.CreateDishRequest;
import com.tingo.restaurants.application.dto.request.UpdateDishRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.DishResponse;
import com.tingo.restaurants.application.service.DishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/dishes")
@RequiredArgsConstructor
@Tag(name = "Platos", description = "Gestión de platos del menú")
public class DishController {

    private final DishService dishService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Agregar plato a un menú")
    public ResponseEntity<ApiResponse<DishResponse>> create(@Valid @RequestBody CreateDishRequest request) {
        DishResponse response = dishService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Plato agregado exitosamente", response));
    }

    @GetMapping("/menu/{menuId}")
    @Operation(summary = "Obtener platos de un menú (público)")
    public ResponseEntity<ApiResponse<List<DishResponse>>> findByMenu(@PathVariable UUID menuId) {
        return ResponseEntity.ok(ApiResponse.ok(dishService.findByMenu(menuId)));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @Operation(summary = "Platos disponibles de un restaurante (público, para pre-pedido)")
    public ResponseEntity<ApiResponse<List<DishResponse>>> findByRestaurant(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(dishService.findAvailableByRestaurant(restaurantId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un plato (público)")
    public ResponseEntity<ApiResponse<DishResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(dishService.findById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar plato (parcial)")
    public ResponseEntity<ApiResponse<DishResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDishRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Plato actualizado", dishService.update(id, request)));
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Activar/desactivar disponibilidad del plato")
    public ResponseEntity<ApiResponse<DishResponse>> toggleAvailability(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Disponibilidad actualizada", dishService.toggleAvailability(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar plato")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        dishService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Plato eliminado", null));
    }
}
