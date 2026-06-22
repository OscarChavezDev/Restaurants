package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.ReservationConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReservationConfigJpaRepository extends JpaRepository<ReservationConfigEntity, UUID> {
    Optional<ReservationConfigEntity> findByRestaurantId(UUID restaurantId);
}
