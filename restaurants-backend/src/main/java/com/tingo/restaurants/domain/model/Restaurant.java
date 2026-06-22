package com.tingo.restaurants.domain.model;

import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Restaurant {

    private UUID id;
    private UUID ownerId;
    private String name;
    private String slug;
    private String description;
    private String phone;
    private String email;
    private String website;
    private String ruc;
    private RestaurantStatus status;

    // Ubicación
    private String address;
    private String district;
    private String city;
    private String region;
    private BigDecimal latitude;
    private BigDecimal longitude;

    // Capacidad
    private int totalCapacity;
    private int priceLevel;
    private BigDecimal avgDishPrice;
    private int minReservationSize;
    private int maxReservationSize;

    // Imágenes
    private String coverImageUrl;
    private String logoUrl;

    // Calificación
    private BigDecimal avgRating;
    private int totalRatings;

    // Características
    private boolean acceptsReservations;
    private boolean acceptsEvents;
    private boolean hasParking;
    private boolean hasWifi;
    private boolean hasAirConditioning;
    private boolean isAccessible;

    // Relaciones
    private List<FoodCategory> categories;
    private List<Schedule> schedules;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    public boolean isActive() {
        return status == RestaurantStatus.ACTIVE && deletedAt == null;
    }

    public boolean isOpenAt(java.time.DayOfWeek day, java.time.LocalTime time) {
        if (schedules == null) return false;
        return schedules.stream()
                .filter(s -> s.getDayOfWeek().name().equals(day.name()))
                .findFirst()
                .map(s -> !s.isClosed() && !time.isBefore(s.getOpeningTime()) && !time.isAfter(s.getClosingTime()))
                .orElse(false);
    }

    public boolean canAcceptReservation(int partySize) {
        return acceptsReservations
                && partySize >= minReservationSize
                && partySize <= maxReservationSize
                && partySize <= totalCapacity;
    }
}
