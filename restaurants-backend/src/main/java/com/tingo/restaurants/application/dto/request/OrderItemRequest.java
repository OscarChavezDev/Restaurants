package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/** Un plato del pre-pedido (S10-07). */
@Data
public class OrderItemRequest {

    @NotNull
    private UUID dishId;

    @Min(1)
    private int quantity;
}
