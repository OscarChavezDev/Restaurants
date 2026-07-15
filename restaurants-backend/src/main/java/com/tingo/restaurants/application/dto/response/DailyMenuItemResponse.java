package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class DailyMenuItemResponse {
    private UUID id;
    private String name;
    private BigDecimal price;
    private boolean available;
}
