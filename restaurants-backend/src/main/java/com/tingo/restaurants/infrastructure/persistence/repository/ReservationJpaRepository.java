package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationJpaRepository extends JpaRepository<ReservationEntity, UUID> {

    Optional<ReservationEntity> findByConfirmationCode(String confirmationCode);

    Page<ReservationEntity> findByRestaurantId(UUID restaurantId, Pageable pageable);

    Page<ReservationEntity> findByRestaurantIdAndReservationDate(UUID restaurantId, LocalDate date, Pageable pageable);

    Page<ReservationEntity> findByCustomerId(UUID customerId, Pageable pageable);

    List<ReservationEntity> findByRestaurantIdAndReservationDateAndStatus(
            UUID restaurantId, LocalDate date, ReservationStatus status);

    /** Reservas de una fecha en cierto estado (para el scheduler de recordatorios, S11). */
    List<ReservationEntity> findByReservationDateAndStatus(LocalDate date, ReservationStatus status);

    /** Reservas en cierto estado y estado de pago (para auto-cancelar impagas, S12-06). */
    List<ReservationEntity> findByStatusAndPaymentStatus(ReservationStatus status, String paymentStatus);

    long countByRestaurantIdAndReservationDateAndStatus(
            UUID restaurantId, LocalDate date, ReservationStatus status);

    @Query("""
        SELECT COALESCE(SUM(r.partySize), 0)
        FROM ReservationEntity r
        WHERE r.restaurantId = :restaurantId
          AND r.reservationDate = :date
          AND r.status IN ('PENDING', 'CONFIRMED')
    """)
    int sumPartySizeByRestaurantAndDate(
            @Param("restaurantId") UUID restaurantId,
            @Param("date") LocalDate date);

    boolean existsByConfirmationCode(String confirmationCode);

    @Query("""
        SELECT COALESCE(SUM(r.partySize), 0)
        FROM ReservationEntity r
        WHERE r.restaurantId = :restaurantId
        AND r.reservationDate = :date
        AND r.startTime <= :time
        AND (r.endTime IS NULL OR r.endTime >= :time)
        AND r.status IN ('PENDING', 'CONFIRMED')
        AND r.deletedAt IS NULL
    """)
    int sumOccupiedSeats(
            @Param("restaurantId") UUID restaurantId,
            @Param("date") LocalDate date,
            @Param("time") java.time.LocalTime time);
}
