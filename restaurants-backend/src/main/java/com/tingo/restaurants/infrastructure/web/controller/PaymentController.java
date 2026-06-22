package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.PaymentProofRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.PaymentResponse;
import com.tingo.restaurants.application.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Pagos", description = "Pago del adelanto de reservas (Sprint 12)")
public class PaymentController {

    private final PaymentService paymentService;

    private UUID uid(UserDetails u) { return u != null ? UUID.fromString(u.getUsername()) : null; }

    private boolean isAdmin(UserDetails u) {
        return u != null && u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping("/proof")
    @Operation(summary = "Subir comprobante de pago del adelanto")
    public ResponseEntity<ApiResponse<PaymentResponse>> submitProof(
            @Valid @RequestBody PaymentProofRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentResponse res = paymentService.submitProof(request, uid(userDetails), isAdmin(userDetails));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Comprobante recibido. El restaurante lo verificará.", res));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @Operation(summary = "Verificar un pago (solo dueño del restaurante)")
    public ResponseEntity<ApiResponse<PaymentResponse>> verify(
            @PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("Pago verificado", paymentService.verify(id, uid(userDetails))));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @Operation(summary = "Rechazar un pago (comprobante inválido o pago no recibido)")
    public ResponseEntity<ApiResponse<PaymentResponse>> reject(
            @PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("Pago rechazado", paymentService.reject(id, uid(userDetails))));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @Operation(summary = "Pagos de un restaurante (solo dueño)")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> byRestaurant(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.listByRestaurant(restaurantId)));
    }
}
