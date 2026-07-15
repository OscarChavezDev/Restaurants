package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.CreateRestaurantRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.NearbyEventResponse;
import com.tingo.restaurants.application.dto.response.NearbyLodgingResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.application.dto.response.RestaurantStatsResponse;
import com.tingo.restaurants.application.service.ReportExportService;
import com.tingo.restaurants.application.service.RestaurantService;
import com.tingo.restaurants.application.service.RestaurantStatsService;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/restaurants")
@RequiredArgsConstructor
@Tag(name = "Restaurantes", description = "Gestión completa de restaurantes")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final com.tingo.restaurants.application.service.ReservationService reservationService;
    private final RestaurantStatsService restaurantStatsService;
    private final ReportExportService reportExportService;
    private final OwnershipGuard ownershipGuard;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear nuevo restaurante")
    public ResponseEntity<ApiResponse<RestaurantResponse>> create(
            @Valid @RequestBody CreateRestaurantRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID ownerId = UUID.fromString(userDetails.getUsername());
        RestaurantResponse response = restaurantService.create(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Restaurante creado exitosamente", response));
    }

    @GetMapping("/{id}/nearby-events")
    @Operation(summary = "Eventos cercanos a este restaurante (Sistema de Eventos)")
    public ResponseEntity<ApiResponse<List<NearbyEventResponse>>> getNearbyEvents(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "10.0") double radiusKm) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.getNearbyEvents(id, radiusKm)));
    }

    @GetMapping("/{id}/nearby-lodging")
    @Operation(summary = "Hospedajes cercanos a este restaurante (Sistema de Hospedaje)")
    public ResponseEntity<ApiResponse<List<NearbyLodgingResponse>>> getNearbyLodging(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "5.0") double radiusKm) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.getNearbyLodging(id, radiusKm)));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Consultar disponibilidad de un restaurante para una fecha y hora")
    public ResponseEntity<ApiResponse<com.tingo.restaurants.application.dto.response.AvailabilityResponse>> getAvailability(
            @PathVariable UUID id,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime time,
            @RequestParam int partySize) {
        return ResponseEntity.ok(ApiResponse.ok(reservationService.checkAvailability(id, date, time, partySize)));
    }

    @GetMapping
    @Operation(summary = "Listar todos los restaurantes activos con paginación")
    public ResponseEntity<ApiResponse<PagedResponse<RestaurantResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "avgRating") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(direction), sortBy));
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar restaurantes con filtros")
    public ResponseEntity<ApiResponse<PagedResponse<RestaurantResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String priceRange,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.search(name, city, categoryId, priceRange, pageable)));
    }

    @GetMapping("/available-now")
    @Operation(summary = "IDs de restaurantes abiertos y con mesas libres ahora")
    public ResponseEntity<ApiResponse<List<UUID>>> availableNow() {
        return ResponseEntity.ok(ApiResponse.ok(reservationService.availableNowRestaurantIds()));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Buscar restaurantes cercanos por coordenadas")
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> findNearby(
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lon,
            @Parameter(description = "Radio de búsqueda en kilómetros")
            @RequestParam(defaultValue = "5.0") double radiusKm) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findNearby(lat, lon, radiusKm)));
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Estadísticas del dueño: reservas por período, no-show, ingresos, platos más pedidos, rating en el tiempo, ocupación por sección")
    public ResponseEntity<ApiResponse<RestaurantStatsResponse>> getStats(
            @PathVariable UUID id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            @RequestParam(defaultValue = "day") String groupBy) {
        ownershipGuard.assertOwnsRestaurant(id);
        return ResponseEntity.ok(ApiResponse.ok(restaurantStatsService.getStats(id, from, to, groupBy)));
    }

    @GetMapping("/{id}/reports/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Exportar reporte de reservas, ingresos y reseñas en Excel o PDF (S15-02)")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable UUID id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "xlsx") String format) {
        ownershipGuard.assertOwnsRestaurant(id);
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(90);

        boolean pdf = "pdf".equalsIgnoreCase(format);
        byte[] content = pdf
                ? reportExportService.exportPdf(id, effectiveFrom, effectiveTo)
                : reportExportService.exportXlsx(id, effectiveFrom, effectiveTo);
        String filename = "reporte-" + id + (pdf ? ".pdf" : ".xlsx");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(pdf ? MediaType.APPLICATION_PDF
                        : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(content);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "ADMIN: Ver TODOS los restaurantes del sistema con filtro opcional por estado")
    public ResponseEntity<ApiResponse<PagedResponse<RestaurantResponse>>> findAllAdmin(
            @RequestParam(required = false) RestaurantStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findAllForAdmin(status, pageable)));
    }

    @GetMapping("/near-event/{eventId}")
    @Operation(summary = "Buscar restaurantes cercanos a un evento")
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> findNearbyEvent(
            @PathVariable String eventId,
            @RequestParam(defaultValue = "3.0") double radiusKm) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findNearbyEvent(eventId, radiusKm)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener restaurante por ID")
    public ResponseEntity<ApiResponse<RestaurantResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findById(id)));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Obtener restaurante por slug")
    public ResponseEntity<ApiResponse<RestaurantResponse>> findBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findBySlug(slug)));
    }

    @GetMapping("/my-restaurants")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obtener mis restaurantes")
    public ResponseEntity<ApiResponse<PagedResponse<RestaurantResponse>>> myRestaurants(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID ownerId = UUID.fromString(userDetails.getUsername());
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.findByOwner(ownerId, pageable)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar información del restaurante (dueño o ADMIN)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateRestaurantRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID requesterId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        RestaurantResponse response = restaurantService.update(id, request, requesterId, isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Restaurante actualizado correctamente", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar estado del restaurante (solo ADMIN)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam RestaurantStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID requesterId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.updateStatus(id, status, requesterId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar restaurante (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID requesterId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        restaurantService.delete(id, requesterId, isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Restaurante eliminado correctamente", null));
    }
}
