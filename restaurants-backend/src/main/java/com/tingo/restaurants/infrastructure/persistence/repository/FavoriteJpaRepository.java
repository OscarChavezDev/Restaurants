package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.FavoriteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavoriteJpaRepository extends JpaRepository<FavoriteEntity, UUID> {
    List<FavoriteEntity> findByCustomerId(UUID customerId);
    boolean existsByCustomerIdAndRestaurantId(UUID customerId, UUID restaurantId);
    void deleteByCustomerIdAndRestaurantId(UUID customerId, UUID restaurantId);
}
