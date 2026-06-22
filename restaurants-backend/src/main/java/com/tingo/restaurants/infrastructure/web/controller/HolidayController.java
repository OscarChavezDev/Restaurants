package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.CreateHolidayRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.HolidayResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantHolidayEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantHolidayJpaRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/restaurants/{restaurantId}/holidays")
@RequiredArgsConstructor
@Tag(name = "Feriados", description = "Días especiales / feriados del restaurante")
public class HolidayController {

    private final RestaurantHolidayJpaRepository holidayRepository;
    private final OwnershipGuard ownershipGuard;

    @GetMapping
    @Operation(summary = "Listar feriados / días especiales (próximos primero)")
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> list(@PathVariable UUID restaurantId) {
        List<HolidayResponse> holidays = holidayRepository
                .findByRestaurantIdAndHolidayDateGreaterThanEqualOrderByHolidayDate(restaurantId, LocalDate.now())
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.ok(holidays));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Agregar un feriado / día especial")
    public ResponseEntity<ApiResponse<HolidayResponse>> create(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CreateHolidayRequest request) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        if (holidayRepository.existsByRestaurantIdAndHolidayDate(restaurantId, request.getHolidayDate())) {
            throw new IllegalStateException("Ya existe un día especial para esa fecha");
        }
        RestaurantHolidayEntity entity = RestaurantHolidayEntity.builder()
                .restaurantId(restaurantId)
                .holidayDate(request.getHolidayDate())
                .description(request.getDescription())
                .closed(request.isClosed())
                .openingTime(request.isClosed() ? null : request.getOpeningTime())
                .closingTime(request.isClosed() ? null : request.getClosingTime())
                .build();
        RestaurantHolidayEntity saved = holidayRepository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Día especial agregado", toResponse(saved)));
    }

    @DeleteMapping("/{holidayId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANTE_OWNER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar un feriado / día especial")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID restaurantId,
            @PathVariable UUID holidayId) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        RestaurantHolidayEntity holiday = holidayRepository.findById(holidayId)
                .orElseThrow(() -> new IllegalStateException("Día especial no encontrado"));
        if (!holiday.getRestaurantId().equals(restaurantId)) {
            throw new AccessDeniedException("El día especial no pertenece a este restaurante");
        }
        holidayRepository.delete(holiday);
        return ResponseEntity.ok(ApiResponse.ok("Día especial eliminado", null));
    }

    private HolidayResponse toResponse(RestaurantHolidayEntity e) {
        return HolidayResponse.builder()
                .id(e.getId())
                .holidayDate(e.getHolidayDate())
                .description(e.getDescription())
                .closed(e.isClosed())
                .openingTime(e.getOpeningTime())
                .closingTime(e.getClosingTime())
                .build();
    }
}
