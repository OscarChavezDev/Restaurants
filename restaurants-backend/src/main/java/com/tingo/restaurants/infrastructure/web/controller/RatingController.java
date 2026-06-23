package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.RatingStatsResponse;
import com.tingo.restaurants.application.service.RatingService;
import com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/ratings")
@RequiredArgsConstructor
@Tag(name = "Reseñas", description = "Endpoints de consulta de reseñas de restaurantes")
public class RatingController {

    private final RatingService ratingService;
    private final RatingJpaRepository ratingJpaRepository;
    private final OwnershipGuard ownershipGuard;

    @GetMapping("/restaurant/{restaurantId}")
    @Operation(summary = "Obtener reseñas de un restaurante")
    public ResponseEntity<ApiResponse<PagedResponse<RatingResponse>>> getRatings(
            @PathVariable UUID restaurantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(ratingService.findByRestaurant(restaurantId, page, size)));
    }

    @GetMapping("/restaurant/{restaurantId}/stats")
    @Operation(summary = "Obtener estadísticas de reseñas de un restaurante")
    public ResponseEntity<ApiResponse<RatingStatsResponse>> getStats(
            @PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(ratingService.getStatsByRestaurant(restaurantId)));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener mis reseñas")
    public ResponseEntity<ApiResponse<PagedResponse<RatingResponse>>> getMyRatings(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("No autorizado", "UNAUTHORIZED"));
        }
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Mis reseñas obtenidas", ratingService.getRatingsByUser(userId, page, size)));
    }

    @PostMapping
    @Operation(summary = "Crear reseña para una reserva completada")
    public ResponseEntity<ApiResponse<RatingResponse>> create(
            @jakarta.validation.Valid @RequestBody com.tingo.restaurants.application.dto.request.CreateRatingRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        UUID userId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.ok("Reseña creada exitosamente", ratingService.createRating(userId, request)));
    }

    @PatchMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Responder a una reseña (solo el dueño del restaurante)")
    public ResponseEntity<ApiResponse<Void>> reply(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        RatingEntity rating = ratingJpaRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Reseña no encontrada"));
        ownershipGuard.assertOwnsRestaurant(rating.getRestaurantId());

        String reply = body.getOrDefault("reply", "").trim();
        if (reply.isEmpty()) {
            rating.setOwnerReply(null);
            rating.setOwnerReplyAt(null);
        } else {
            rating.setOwnerReply(reply);
            rating.setOwnerReplyAt(LocalDateTime.now());
        }
        ratingJpaRepository.save(rating);
        return ResponseEntity.ok(ApiResponse.ok(reply.isEmpty() ? "Respuesta eliminada" : "Respuesta publicada", null));
    }
}
