package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RestaurantImageResponse {
    private UUID id;
    private UUID restaurantId;
    private String url;
    private String caption;
    private int displayOrder;
    private LocalDateTime createdAt;
}
