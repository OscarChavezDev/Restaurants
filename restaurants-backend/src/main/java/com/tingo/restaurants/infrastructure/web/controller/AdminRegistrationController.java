package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.RegistrationRequestResponse;
import com.tingo.restaurants.application.service.RegistrationReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/admin/registration-requests")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin · Solicitudes", description = "Revisión de solicitudes de cuenta de restaurante")
public class AdminRegistrationController {

    private final RegistrationReviewService reviewService;

    @GetMapping
    @Operation(summary = "Listar solicitudes de cuenta pendientes")
    public ResponseEntity<ApiResponse<List<RegistrationRequestResponse>>> listPending() {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.listPending()));
    }

    @PostMapping("/{userId}/approve")
    @Operation(summary = "Aprobar una solicitud (activa la cuenta y publica el restaurante)")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable UUID userId) {
        reviewService.approve(userId);
        return ResponseEntity.ok(ApiResponse.ok("Solicitud aprobada", null));
    }

    @PostMapping("/{userId}/reject")
    @Operation(summary = "Rechazar una solicitud")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        reviewService.reject(userId, reason);
        return ResponseEntity.ok(ApiResponse.ok("Solicitud rechazada", null));
    }
}
