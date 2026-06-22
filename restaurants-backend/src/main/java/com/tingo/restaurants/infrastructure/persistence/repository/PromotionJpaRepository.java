package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.PromotionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PromotionJpaRepository extends JpaRepository<PromotionEntity, UUID> {
    List<PromotionEntity> findByRestaurantIdAndDeletedAtIsNull(UUID restaurantId);

    @Query("""
        SELECT p FROM PromotionEntity p
        WHERE p.restaurantId = :restaurantId
          AND p.active = true
          AND p.deletedAt IS NULL
          AND CURRENT_TIMESTAMP BETWEEN p.validFrom AND p.validUntil
    """)
    List<PromotionEntity> findActiveByRestaurantId(@Param("restaurantId") UUID restaurantId);

    @Query("""
        SELECT p FROM PromotionEntity p
        WHERE p.active = true
          AND p.deletedAt IS NULL
          AND p.flyerHeadline IS NOT NULL
          AND CURRENT_TIMESTAMP BETWEEN p.validFrom AND p.validUntil
        ORDER BY p.updatedAt DESC
    """)
    List<PromotionEntity> findShowcase();
}
