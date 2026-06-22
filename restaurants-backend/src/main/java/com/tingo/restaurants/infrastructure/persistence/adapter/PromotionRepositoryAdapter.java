package com.tingo.restaurants.infrastructure.persistence.adapter;

import com.tingo.restaurants.domain.model.Promotion;
import com.tingo.restaurants.domain.repository.PromotionRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.PromotionEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.PromotionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PromotionRepositoryAdapter implements PromotionRepository {

    private final PromotionJpaRepository jpaRepository;

    @Override
    public Promotion save(Promotion promotion) {
        return toDomain(jpaRepository.save(toEntity(promotion)));
    }

    @Override
    public Optional<Promotion> findById(UUID id) {
        return jpaRepository.findById(id).filter(e -> e.getDeletedAt() == null).map(this::toDomain);
    }

    @Override
    public List<Promotion> findByRestaurantId(UUID restaurantId) {
        return jpaRepository.findByRestaurantIdAndDeletedAtIsNull(restaurantId)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Promotion> findActiveByRestaurantId(UUID restaurantId) {
        return jpaRepository.findActiveByRestaurantId(restaurantId)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Promotion> findShowcase() {
        return jpaRepository.findShowcase().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.findById(id).ifPresent(e -> { e.softDelete(); jpaRepository.save(e); });
    }

    private Promotion toDomain(PromotionEntity e) {
        return Promotion.builder()
                .id(e.getId()).restaurantId(e.getRestaurantId()).title(e.getTitle())
                .description(e.getDescription()).promoType(e.getPromoType())
                .discountValue(e.getDiscountValue()).minOrderAmount(e.getMinOrderAmount())
                .promoCode(e.getPromoCode()).imageUrl(e.getImageUrl())
                .validFrom(e.getValidFrom()).validUntil(e.getValidUntil())
                .isActive(e.isActive()).usageLimit(e.getUsageLimit()).usageCount(e.getUsageCount())
                .flyerHeadline(e.getFlyerHeadline()).flyerTagline(e.getFlyerTagline())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).deletedAt(e.getDeletedAt())
                .build();
    }

    private PromotionEntity toEntity(Promotion p) {
        PromotionEntity e = new PromotionEntity();
        e.setId(p.getId()); e.setRestaurantId(p.getRestaurantId()); e.setTitle(p.getTitle());
        e.setDescription(p.getDescription()); e.setPromoType(p.getPromoType());
        e.setDiscountValue(p.getDiscountValue()); e.setMinOrderAmount(p.getMinOrderAmount());
        e.setPromoCode(p.getPromoCode()); e.setImageUrl(p.getImageUrl());
        e.setValidFrom(p.getValidFrom()); e.setValidUntil(p.getValidUntil());
        e.setActive(p.isActive()); e.setUsageLimit(p.getUsageLimit()); e.setUsageCount(p.getUsageCount());
        e.setFlyerHeadline(p.getFlyerHeadline()); e.setFlyerTagline(p.getFlyerTagline());
        return e;
    }
}
