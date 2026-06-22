package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentJpaRepository extends JpaRepository<PaymentEntity, UUID> {
    List<PaymentEntity> findByRestaurantIdOrderByCreatedAtDesc(UUID restaurantId);
    List<PaymentEntity> findByReservationIdOrderByCreatedAtDesc(UUID reservationId);
}
