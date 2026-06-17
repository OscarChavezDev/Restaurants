package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RestaurantImageJpaRepository extends JpaRepository<RestaurantImageEntity, UUID> {

    List<RestaurantImageEntity> findByRestaurantIdOrderByDisplayOrderAsc(UUID restaurantId);
}
