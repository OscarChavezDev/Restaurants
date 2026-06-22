package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RestaurantResponse {

    private UUID id;
    private UUID ownerId;
    private String name;
    private String slug;
    private String description;
    private String phone;
    private String email;
    private String website;
    private RestaurantStatus status;

    private String address;
    private String district;
    private String city;
    private String region;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private int totalCapacity;
    private int priceLevel;
    private BigDecimal avgDishPrice;
    private String priceRange; // LOW | MEDIUM | HIGH (derivado de avgDishPrice)
    private int minReservationSize;
    private int maxReservationSize;

    private String coverImageUrl;
    private String logoUrl;

    private BigDecimal avgRating;
    private int totalRatings;

    private boolean acceptsReservations;
    private boolean acceptsEvents;
    private boolean hasParking;
    private boolean hasWifi;
    private boolean hasAirConditioning;
    @JsonProperty("isAccessible")
    private boolean isAccessible;

    private List<String> categories;
    private List<UUID> categoryIds;
    private List<ScheduleResponse> schedules;

    private LocalDateTime createdAt;

    // Campo adicional para resultados de búsqueda cercana
    private Double distanceKm;
}
