package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.TableOrderStatusRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantTableEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantTableJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Webhook piloto para el software propio de pedidos en mesas (solo "El Encanto
 * de la Selva" por ahora). No usa JWT ni el portal de desarrollador: es un
 * secreto compartido fijo (TABLE_ORDER_INTEGRATION_API_KEY) porque es una
 * integración de un solo restaurante, controlada por el mismo dueño del
 * software externo. Ver SecurityConfig — esta ruta está en permitAll() y la
 * validación del header ocurre acá mismo.
 */
@RestController
@RequestMapping("/v1/table-order-integration")
@RequiredArgsConstructor
@Tag(name = "Integración de pedidos en mesa", description = "Webhook piloto para marcar mesas ocupadas/libres desde el software propio de pedidos")
public class TableOrderIntegrationController {

    private final RestaurantTableJpaRepository tableRepository;

    @Value("${table-order-integration.api-key:}")
    private String configuredApiKey;

    @PatchMapping("/tables/{tableId}/order-status")
    @Operation(
        summary = "Marcar una mesa ocupada/libre por un pedido",
        description = "Llamado por el software propio de pedidos en mesas al registrar (u ocupar) un " +
                      "pedido. Autenticado con el header X-Table-Integration-Key, no con JWT."
    )
    public ResponseEntity<ApiResponse<Void>> updateOrderStatus(
            @PathVariable UUID tableId,
            @RequestHeader(value = "X-Table-Integration-Key", required = false) String apiKey,
            @Valid @RequestBody TableOrderStatusRequest req) {
        if (configuredApiKey.isBlank() || !configuredApiKey.equals(apiKey)) {
            throw new AccessDeniedException("API key inválida o integración no configurada");
        }
        RestaurantTableEntity table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada"));
        table.setCurrentStatus(req.isOccupied() ? "OCCUPIED" : "AVAILABLE");
        tableRepository.save(table);
        return ResponseEntity.ok(ApiResponse.ok("Estado actualizado", null));
    }
}
