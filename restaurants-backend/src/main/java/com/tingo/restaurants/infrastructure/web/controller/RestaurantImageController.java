package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.RestaurantImageResponse;
import com.tingo.restaurants.application.service.RestaurantImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/restaurants")
@RequiredArgsConstructor
@Tag(name = "Imágenes", description = "Galería de fotos de restaurantes")
public class RestaurantImageController {

    private final RestaurantImageService imageService;

    @GetMapping("/{restaurantId}/images")
    @Operation(summary = "Obtener galería de fotos de un restaurante")
    public ResponseEntity<ApiResponse<List<RestaurantImageResponse>>> getImages(
            @PathVariable UUID restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(imageService.findByRestaurant(restaurantId)));
    }
}
