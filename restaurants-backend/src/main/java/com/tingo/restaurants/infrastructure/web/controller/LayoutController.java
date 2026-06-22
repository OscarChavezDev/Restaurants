package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.CreateSectionRequest;
import com.tingo.restaurants.application.dto.request.CreateTableRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.SectionResponse;
import com.tingo.restaurants.application.dto.response.TableResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantSectionEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantTableEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantSectionJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantTableJpaRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/restaurants/{restaurantId}")
@RequiredArgsConstructor
@Tag(name = "Local (secciones y mesas)", description = "Gestión de secciones del local y mesas")
public class LayoutController {

    private final RestaurantSectionJpaRepository sectionRepository;
    private final RestaurantTableJpaRepository tableRepository;
    private final OwnershipGuard ownershipGuard;

    // ─── Secciones ──────────────────────────────────────────────
    @GetMapping("/sections")
    @Operation(summary = "Listar secciones del local")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> listSections(@PathVariable UUID restaurantId) {
        List<SectionResponse> data = sectionRepository.findByRestaurantIdOrderByName(restaurantId)
                .stream().map(this::toSectionResponse).toList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/sections")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear sección del local")
    public ResponseEntity<ApiResponse<SectionResponse>> createSection(
            @PathVariable UUID restaurantId, @Valid @RequestBody CreateSectionRequest req) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        RestaurantSectionEntity e = RestaurantSectionEntity.builder()
                .restaurantId(restaurantId)
                .name(req.getName())
                .type(req.getType() == null ? "INTERIOR" : req.getType())
                .capacity(req.getCapacity())
                .active(true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Sección creada", toSectionResponse(sectionRepository.save(e))));
    }

    @DeleteMapping("/sections/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar sección del local")
    public ResponseEntity<ApiResponse<Void>> deleteSection(
            @PathVariable UUID restaurantId, @PathVariable UUID sectionId) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        RestaurantSectionEntity e = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalStateException("Sección no encontrada"));
        if (!e.getRestaurantId().equals(restaurantId)) {
            throw new AccessDeniedException("La sección no pertenece a este restaurante");
        }
        sectionRepository.delete(e);
        return ResponseEntity.ok(ApiResponse.ok("Sección eliminada", null));
    }

    // ─── Mesas ──────────────────────────────────────────────────
    @GetMapping("/tables")
    @Operation(summary = "Listar mesas del local")
    public ResponseEntity<ApiResponse<List<TableResponse>>> listTables(@PathVariable UUID restaurantId) {
        Map<UUID, String> sectionNames = sectionRepository.findByRestaurantIdOrderByName(restaurantId)
                .stream().collect(Collectors.toMap(RestaurantSectionEntity::getId, RestaurantSectionEntity::getName));
        List<TableResponse> data = tableRepository.findByRestaurantIdOrderByTableNumber(restaurantId)
                .stream().map(t -> toTableResponse(t, sectionNames)).toList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear mesa")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(
            @PathVariable UUID restaurantId, @Valid @RequestBody CreateTableRequest req) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        if (tableRepository.existsByRestaurantIdAndTableNumber(restaurantId, req.getTableNumber())) {
            throw new IllegalStateException("Ya existe una mesa con ese número");
        }
        RestaurantTableEntity e = RestaurantTableEntity.builder()
                .restaurantId(restaurantId)
                .sectionId(req.getSectionId())
                .tableNumber(req.getTableNumber())
                .capacity(req.getCapacity())
                .active(true)
                .build();
        Map<UUID, String> sectionNames = sectionRepository.findByRestaurantIdOrderByName(restaurantId)
                .stream().collect(Collectors.toMap(RestaurantSectionEntity::getId, RestaurantSectionEntity::getName));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Mesa creada", toTableResponse(tableRepository.save(e), sectionNames)));
    }

    @DeleteMapping("/tables/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar mesa")
    public ResponseEntity<ApiResponse<Void>> deleteTable(
            @PathVariable UUID restaurantId, @PathVariable UUID tableId) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        RestaurantTableEntity e = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalStateException("Mesa no encontrada"));
        if (!e.getRestaurantId().equals(restaurantId)) {
            throw new AccessDeniedException("La mesa no pertenece a este restaurante");
        }
        tableRepository.delete(e);
        return ResponseEntity.ok(ApiResponse.ok("Mesa eliminada", null));
    }

    // ─── Mapeo ──────────────────────────────────────────────────
    private SectionResponse toSectionResponse(RestaurantSectionEntity e) {
        return SectionResponse.builder()
                .id(e.getId()).name(e.getName()).type(e.getType())
                .capacity(e.getCapacity()).active(e.isActive()).build();
    }

    private TableResponse toTableResponse(RestaurantTableEntity t, Map<UUID, String> sectionNames) {
        return TableResponse.builder()
                .id(t.getId()).tableNumber(t.getTableNumber()).capacity(t.getCapacity())
                .sectionId(t.getSectionId())
                .sectionName(t.getSectionId() != null ? sectionNames.get(t.getSectionId()) : null)
                .active(t.isActive()).build();
    }
}
