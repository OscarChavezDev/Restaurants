package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.DishEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface DishJpaRepository extends JpaRepository<DishEntity, UUID> {
    List<DishEntity> findByMenuIdAndDeletedAtIsNull(UUID menuId);
    List<DishEntity> findByRestaurantIdAndDeletedAtIsNull(UUID restaurantId);

    @Query("SELECT AVG(d.price) FROM DishEntity d WHERE d.restaurantId = :rid AND d.isAvailable = true AND d.deletedAt IS NULL")
    BigDecimal avgAvailablePrice(@Param("rid") UUID rid);

    @Query("SELECT MIN(d.price) FROM DishEntity d WHERE d.restaurantId = :rid AND d.isAvailable = true AND d.deletedAt IS NULL")
    BigDecimal minAvailablePrice(@Param("rid") UUID rid);
}
