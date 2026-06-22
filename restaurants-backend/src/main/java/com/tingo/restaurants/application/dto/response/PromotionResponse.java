package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.tingo.restaurants.domain.model.enums.PromotionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
public class PromotionResponse {
    private UUID id;
    private UUID restaurantId;
    private String title;
    private String description;
    private PromotionType promoType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private String promoCode;
    private String imageUrl;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    @JsonProperty("isActive")
    private boolean isActive;
    private Integer usageLimit;
    private int usageCount;
    private String flyerHeadline;
    private String flyerTagline;
    // Solo se completan en el carrusel de ofertas (showcase).
    private String restaurantName;
    private String restaurantSlug;
}
