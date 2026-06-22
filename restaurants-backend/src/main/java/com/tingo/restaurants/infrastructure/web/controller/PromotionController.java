package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.PromotionResponse;
import com.tingo.restaurants.application.service.PromotionService;
import com.tingo.restaurants.domain.model.enums.PromotionType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/promotions")
@RequiredArgsConstructor
@Tag(name = "Promociones", description = "Gestión de promociones y descuentos")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear promoción para un restaurante")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(
            @PathVariable UUID restaurantId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam PromotionType promoType,
            @RequestParam(required = false) BigDecimal discountValue,
            @RequestParam(required = false) BigDecimal minOrderAmount,
            @RequestParam(required = false) String promoCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime validFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime validUntil,
            @RequestParam(required = false) Integer usageLimit) {
        PromotionResponse response = promotionService.create(restaurantId, title, description,
                promoType, discountValue, minOrderAmount, promoCode, validFrom, validUntil, usageLimit);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Promoción creada", response));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @Operation(summary = "Listar todas las promociones de un restaurante (público)")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> findByRestaurant(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(promotionService.findByRestaurant(restaurantId)));
    }

    @GetMapping("/restaurant/{restaurantId}/active")
    @Operation(summary = "Listar promociones activas de un restaurante (público)")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> findActiveByRestaurant(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(promotionService.findActiveByRestaurant(restaurantId)));
    }

    @GetMapping("/showcase")
    @Operation(summary = "Ofertas activas (con flyer) de todos los restaurantes, para el carrusel (público)")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> showcase() {
        return ResponseEntity.ok(ApiResponse.ok(promotionService.showcase()));
    }

    @PostMapping("/{id}/flyer")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Generar el copy del flyer con IA para una promoción")
    public ResponseEntity<ApiResponse<PromotionResponse>> generateFlyer(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Flyer generado", promotionService.generateFlyer(id)));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Activar / desactivar una promoción")
    public ResponseEntity<ApiResponse<PromotionResponse>> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Estado actualizado", promotionService.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar promoción")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        promotionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Promoción eliminada", null));
    }
}
