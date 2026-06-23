package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PaymentJpaRepository extends JpaRepository<PaymentEntity, UUID> {
    List<PaymentEntity> findByRestaurantIdOrderByCreatedAtDesc(UUID restaurantId);
    List<PaymentEntity> findByReservationIdOrderByCreatedAtDesc(UUID reservationId);

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0) FROM PaymentEntity p
        WHERE p.restaurantId = :restaurantId AND p.status = 'VERIFIED'
        AND p.createdAt BETWEEN :from AND :to
    """)
    BigDecimal sumVerifiedAmountByRestaurant(
            @Param("restaurantId") UUID restaurantId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /** Panel admin global (S15-01): ingreso total verificado de todo el sistema. */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentEntity p WHERE p.status = 'VERIFIED' AND p.createdAt BETWEEN :from AND :to")
    BigDecimal sumAllVerifiedAmount(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Exportación de reportes (S15-02): pagos verificados de un restaurante en un rango. */
    List<PaymentEntity> findByRestaurantIdAndStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID restaurantId, String status, LocalDateTime from, LocalDateTime to);
}
