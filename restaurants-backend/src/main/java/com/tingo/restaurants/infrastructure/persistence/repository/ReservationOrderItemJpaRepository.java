package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.ReservationOrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReservationOrderItemJpaRepository extends JpaRepository<ReservationOrderItemEntity, UUID> {
    List<ReservationOrderItemEntity> findByReservationId(UUID reservationId);

    @Query(value = """
        SELECT oi.dish_name AS dishName, SUM(oi.quantity) AS cantidad
        FROM reservation_order_items oi
        JOIN reservations r ON r.id = oi.reservation_id
        WHERE r.restaurant_id = :restaurantId
          AND r.reservation_date BETWEEN :from AND :to
          AND r.deleted_at IS NULL
        GROUP BY oi.dish_name
        ORDER BY cantidad DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> topDishesByRestaurant(
            @Param("restaurantId") UUID restaurantId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
