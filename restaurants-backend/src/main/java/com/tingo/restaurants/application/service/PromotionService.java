package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.PromotionResponse;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.Promotion;
import com.tingo.restaurants.domain.model.enums.PromotionType;
import com.tingo.restaurants.domain.exception.DomainException;
import com.tingo.restaurants.domain.repository.PromotionRepository;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final RestaurantRepository restaurantRepository;
    private final OwnershipGuard ownershipGuard;

    @Transactional
    public PromotionResponse create(UUID restaurantId, String title, String description,
                                    PromotionType promoType, BigDecimal discountValue,
                                    BigDecimal minOrderAmount, String promoCode,
                                    LocalDateTime validFrom, LocalDateTime validUntil,
                                    Integer usageLimit) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        ownershipGuard.assertOwnsRestaurant(restaurantId);

        Promotion promo = Promotion.builder()
                .id(UUID.randomUUID()).restaurantId(restaurantId).title(title)
                .description(description).promoType(promoType).discountValue(discountValue)
                .minOrderAmount(minOrderAmount).promoCode(promoCode)
                .validFrom(validFrom).validUntil(validUntil).isActive(true)
                .usageLimit(usageLimit).usageCount(0)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        return toResponse(promotionRepository.save(promo));
    }

    public List<PromotionResponse> findByRestaurant(UUID restaurantId) {
        return promotionRepository.findByRestaurantId(restaurantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PromotionResponse> findActiveByRestaurant(UUID restaurantId) {
        return promotionRepository.findActiveByRestaurantId(restaurantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new DomainException("Promoción no encontrada", "PROMOTION_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(promo.getRestaurantId());
        promotionRepository.deleteById(id);
    }

    private PromotionResponse toResponse(Promotion p) {
        return PromotionResponse.builder()
                .id(p.getId()).restaurantId(p.getRestaurantId()).title(p.getTitle())
                .description(p.getDescription()).promoType(p.getPromoType())
                .discountValue(p.getDiscountValue()).minOrderAmount(p.getMinOrderAmount())
                .promoCode(p.getPromoCode()).imageUrl(p.getImageUrl())
                .validFrom(p.getValidFrom()).validUntil(p.getValidUntil())
                .isActive(p.isActive()).usageLimit(p.getUsageLimit()).usageCount(p.getUsageCount())
                .build();
    }
}
