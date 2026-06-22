package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantSectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RestaurantSectionJpaRepository extends JpaRepository<RestaurantSectionEntity, UUID> {
    List<RestaurantSectionEntity> findByRestaurantIdOrderByName(UUID restaurantId);
}
