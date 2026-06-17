package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.RatingStatsResponse;
import com.tingo.restaurants.application.service.RatingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/ratings")
@RequiredArgsConstructor
@Tag(name = "Reseñas", description = "Endpoints de consulta de reseñas de restaurantes")
public class RatingController {

    private final RatingService ratingService;

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

    @PostMapping
    @Operation(summary = "Crear reseña para una reserva completada")
    public ResponseEntity<ApiResponse<RatingResponse>> create(
            @jakarta.validation.Valid @RequestBody com.tingo.restaurants.application.dto.request.CreateRatingRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        UUID userId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.ok("Reseña creada exitosamente", ratingService.createRating(userId, request)));
    }
}
