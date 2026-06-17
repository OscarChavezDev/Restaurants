package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class MenuResponse {
    private UUID id;
    private UUID restaurantId;
    private String name;
    private String description;
    @JsonProperty("isActive")
    private boolean isActive;
    private LocalDate validFrom;
    private LocalDate validUntil;
    private List<DishResponse> dishes;
    private LocalDateTime createdAt;
}
