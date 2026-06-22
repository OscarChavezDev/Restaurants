package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.ReservationOrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReservationOrderItemJpaRepository extends JpaRepository<ReservationOrderItemEntity, UUID> {
    List<ReservationOrderItemEntity> findByReservationId(UUID reservationId);
}
