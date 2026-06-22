package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.infrastructure.integration.MapsLinkResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/v1/geo")
@RequiredArgsConstructor
@Tag(name = "Geo", description = "Utilidades de geolocalización")
public class GeoController {

    private final MapsLinkResolver mapsLinkResolver;

    @GetMapping("/resolve")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Extraer lat/lng (y nombre) de un enlace de Google Maps, incluso enlaces cortos")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolve(@RequestParam String url) {
        MapsLinkResolver.ResolvedLocation loc = mapsLinkResolver.resolve(url);
        if (loc == null) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(ApiResponse.error("No se pudieron extraer coordenadas del enlace", "GEO_PARSE_FAILED"));
        }
        Map<String, Object> data = new HashMap<>();
        data.put("lat", loc.lat());
        data.put("lng", loc.lng());
        data.put("name", loc.name());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
