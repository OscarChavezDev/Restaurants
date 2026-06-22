package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.FavoriteEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.FavoriteJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/favorites")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Favoritos", description = "Restaurantes favoritos del cliente")
public class FavoriteController {

    private final FavoriteJpaRepository favoriteRepository;

    private UUID userId(UserDetails u) { return UUID.fromString(u.getUsername()); }

    @GetMapping
    @Operation(summary = "Listar IDs de restaurantes favoritos del usuario")
    public ResponseEntity<ApiResponse<List<UUID>>> myFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        List<UUID> ids = favoriteRepository.findByCustomerId(userId(userDetails))
                .stream().map(FavoriteEntity::getRestaurantId).toList();
        return ResponseEntity.ok(ApiResponse.ok(ids));
    }

    @PostMapping("/{restaurantId}")
    @Operation(summary = "Agregar restaurante a favoritos")
    public ResponseEntity<ApiResponse<Void>> add(@PathVariable UUID restaurantId, @AuthenticationPrincipal UserDetails userDetails) {
        UUID uid = userId(userDetails);
        if (!favoriteRepository.existsByCustomerIdAndRestaurantId(uid, restaurantId)) {
            favoriteRepository.save(FavoriteEntity.builder().customerId(uid).restaurantId(restaurantId).build());
        }
        return ResponseEntity.ok(ApiResponse.ok("Agregado a favoritos", null));
    }

    @DeleteMapping("/{restaurantId}")
    @Transactional
    @Operation(summary = "Quitar restaurante de favoritos")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable UUID restaurantId, @AuthenticationPrincipal UserDetails userDetails) {
        favoriteRepository.deleteByCustomerIdAndRestaurantId(userId(userDetails), restaurantId);
        return ResponseEntity.ok(ApiResponse.ok("Quitado de favoritos", null));
    }
}
