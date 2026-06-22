package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class ReservationOrderItemResponse {
    private UUID dishId;
    private String dishName;
    private int quantity;
    private BigDecimal unitPrice;
}
