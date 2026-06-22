package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.WaitlistEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface WaitlistJpaRepository extends JpaRepository<WaitlistEntity, UUID> {

    List<WaitlistEntity> findByRestaurantIdAndStatusOrderByCreatedAt(UUID restaurantId, String status);

    List<WaitlistEntity> findByRestaurantIdAndReservationDateAndStatusOrderByCreatedAt(
            UUID restaurantId, LocalDate reservationDate, String status);

    boolean existsByRestaurantIdAndCustomerIdAndReservationDateAndStatus(
            UUID restaurantId, UUID customerId, LocalDate reservationDate, String status);
}
