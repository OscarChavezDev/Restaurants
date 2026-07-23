package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.GenerateApiKeyRequest;
import com.tingo.restaurants.application.dto.response.ApiKeyCreatedResponse;
import com.tingo.restaurants.application.dto.response.ApiKeyResponse;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.service.ApiKeyService;
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

/**
 * Gestión de las propias API keys (requiere el JWT normal de sesión, no una
 * key). Originalmente solo para el rol DEVELOPER (portal de catálogo); también
 * la usan dueños de restaurante (RESTAURANTE_OWNER) para generar la key que
 * autentica a su propio software de mesero — ApiKeyAuthenticationFilter carga
 * al usuario real dueño de la key, así que los @PreAuthorize/OwnershipGuard de
 * cualquier endpoint (ej. LayoutController.updateTableStatus) funcionan igual
 * que con el JWT, sin necesitar código nuevo por rol.
 */
@RestController
@RequestMapping("/v1/developer/api-keys")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DEVELOPER', 'RESTAURANTE_OWNER')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Gestión de API Keys", description = "Generar, listar y revocar las propias API keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    private UUID userId(UserDetails u) {
        return UUID.fromString(u.getUsername());
    }

    @PostMapping
    @Operation(summary = "Generar una nueva API key (el valor completo solo se devuelve acá, una vez)")
    public ResponseEntity<ApiResponse<ApiKeyCreatedResponse>> generate(
            @Valid @RequestBody GenerateApiKeyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiKeyCreatedResponse response = apiKeyService.generate(userId(userDetails), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("API key generada. Guárdala ahora: no se volverá a mostrar.", response));
    }

    @GetMapping
    @Operation(summary = "Listar mis API keys (sin el valor real, solo el prefijo)")
    public ResponseEntity<ApiResponse<List<ApiKeyResponse>>> list(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(apiKeyService.listForUser(userId(userDetails))));
    }

    @DeleteMapping("/{keyId}")
    @Operation(summary = "Revocar una API key propia")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @PathVariable UUID keyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        apiKeyService.revoke(userId(userDetails), keyId);
        return ResponseEntity.ok(ApiResponse.ok("API key revocada", null));
    }

    @PostMapping("/{keyId}/regenerate")
    @Operation(summary = "Revocar y crear una nueva clave con el mismo nombre (el valor completo solo se devuelve acá, una vez)")
    public ResponseEntity<ApiResponse<ApiKeyCreatedResponse>> regenerate(
            @PathVariable UUID keyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiKeyCreatedResponse response = apiKeyService.regenerate(userId(userDetails), keyId);
        return ResponseEntity.ok(
                ApiResponse.ok("API key regenerada. Guárdala ahora: no se volverá a mostrar.", response));
    }
}
