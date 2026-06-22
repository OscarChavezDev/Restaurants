package com.tingo.restaurants.domain.model;

import com.tingo.restaurants.domain.model.enums.PromotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {

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
    private boolean isActive;
    private Integer usageLimit;
    private int usageCount;
    private String flyerHeadline;
    private String flyerTagline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    public boolean isCurrentlyValid() {
        if (!isActive || deletedAt != null) return false;
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(validFrom) && !now.isAfter(validUntil);
    }

    public boolean hasRemainingUsages() {
        return usageLimit == null || usageCount < usageLimit;
    }

    public boolean isApplicable() {
        return isCurrentlyValid() && hasRemainingUsages();
    }
}
