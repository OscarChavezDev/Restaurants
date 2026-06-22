package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.infrastructure.integration.CloudinarySignatureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/v1/images")
@RequiredArgsConstructor
@Tag(name = "Imágenes", description = "Subida de imágenes a Cloudinary (signed upload)")
public class ImageUploadController {

    private final CloudinarySignatureService signatureService;

    @PostMapping("/sign")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obtener firma para subir una imagen directo a Cloudinary (cualquier usuario autenticado: el cliente sube su comprobante)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sign(
            @RequestParam(required = false) String folder) {
        if (!signatureService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Cloudinary no está configurado en el servidor", "CLOUDINARY_NOT_CONFIGURED"));
        }
        return ResponseEntity.ok(ApiResponse.ok(signatureService.sign(folder)));
    }
}
