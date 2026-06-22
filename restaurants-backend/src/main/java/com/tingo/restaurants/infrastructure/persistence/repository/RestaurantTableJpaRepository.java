package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantTableEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RestaurantTableJpaRepository extends JpaRepository<RestaurantTableEntity, UUID> {
    List<RestaurantTableEntity> findByRestaurantIdOrderByTableNumber(UUID restaurantId);
    boolean existsByRestaurantIdAndTableNumber(UUID restaurantId, String tableNumber);
    long countByRestaurantId(UUID restaurantId);
}
