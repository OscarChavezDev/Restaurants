package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.WaitlistRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.WaitlistResponse;
import com.tingo.restaurants.application.service.WaitlistService;
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
@RequestMapping("/v1/waitlist")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Lista de espera", description = "Anotaciones cuando no hay cupo (Sprint 11)")
public class WaitlistController {

    private final WaitlistService waitlistService;

    private UUID uid(UserDetails u) { return u != null ? UUID.fromString(u.getUsername()) : null; }

    private boolean isAdmin(UserDetails u) {
        return u != null && u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping
    @Operation(summary = "Anotarse en lista de espera")
    public ResponseEntity<ApiResponse<WaitlistResponse>> join(
            @Valid @RequestBody WaitlistRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        WaitlistResponse res = waitlistService.join(request, uid(userDetails));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Te anotamos en la lista de espera", res));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @Operation(summary = "Lista de espera de un restaurante (solo dueño)")
    public ResponseEntity<ApiResponse<List<WaitlistResponse>>> byRestaurant(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(waitlistService.listByRestaurant(restaurantId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar una anotación de lista de espera")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        waitlistService.cancel(id, uid(userDetails), isAdmin(userDetails));
        return ResponseEntity.ok(ApiResponse.ok("Anotación cancelada", null));
    }
}
