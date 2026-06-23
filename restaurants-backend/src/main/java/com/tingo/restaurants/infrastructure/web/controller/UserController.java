package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.UpdateProfileRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.CustomerHistoryResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.UserResponse;
import com.tingo.restaurants.application.service.CustomerHistoryService;
import com.tingo.restaurants.application.service.UserService;
import com.tingo.restaurants.domain.model.enums.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Usuarios", description = "Gestión de usuarios del sistema")
public class UserController {

    private final UserService userService;
    private final CustomerHistoryService customerHistoryService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener mi perfil")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID id = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.getMyProfile(id)));
    }

    @GetMapping("/me/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historial del cliente: próximas reservas, restaurantes visitados, reseñas, cocina favorita y gasto estimado")
    public ResponseEntity<ApiResponse<CustomerHistoryResponse>> getMyHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID id = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(customerHistoryService.getHistory(id)));
    }

    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Actualizar mi perfil")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        UUID id = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.updateMyProfile(id, request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todos los usuarios")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(userService.listUsers(pageable)));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cambiar rol de un usuario")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable UUID id,
            @RequestParam UserRole role) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateRole(id, role)));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activar o desactivar un usuario")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar un usuario (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Usuario eliminado").build());
    }
}
