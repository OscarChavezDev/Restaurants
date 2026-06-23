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

    // ── Estadísticas del dueño (S13-01) ────────────────────────────────────

    long countByRestaurantIdAndReservationDateBetweenAndStatus(
            UUID restaurantId, LocalDate from, LocalDate to, ReservationStatus status);

    @Query(value = """
        SELECT date_trunc(:unit, CAST(r.reservation_date AS timestamp)) AS periodo, COUNT(*) AS cantidad
        FROM reservations r
        WHERE r.restaurant_id = :restaurantId
          AND r.reservation_date BETWEEN :from AND :to
          AND r.deleted_at IS NULL
        GROUP BY periodo
        ORDER BY periodo
    """, nativeQuery = true)
    List<Object[]> countReservationsByPeriod(
            @Param("restaurantId") UUID restaurantId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("unit") String unit);

    @Query(value = """
        SELECT s.name AS sectionName, COUNT(*) AS cantidad
        FROM reservations r
        JOIN restaurant_sections s ON s.id = r.section_id
        WHERE r.restaurant_id = :restaurantId
          AND r.reservation_date BETWEEN :from AND :to
          AND r.deleted_at IS NULL
        GROUP BY s.name
        ORDER BY cantidad DESC
    """, nativeQuery = true)
    List<Object[]> occupancyBySection(
            @Param("restaurantId") UUID restaurantId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    // ── Historial del cliente (S13-02) ─────────────────────────────────────

    List<ReservationEntity> findByCustomerIdAndStatusAndReservationDateGreaterThanEqualOrderByReservationDateAscStartTimeAsc(
            UUID customerId, ReservationStatus status, LocalDate fromDate);

    List<ReservationEntity> findByCustomerIdAndStatus(UUID customerId, ReservationStatus status);

    @Query("SELECT COALESCE(SUM(r.advanceAmount), 0) FROM ReservationEntity r WHERE r.customerId = :customerId AND r.status = :status")
    java.math.BigDecimal sumAdvanceAmountByCustomerAndStatus(
            @Param("customerId") UUID customerId,
            @Param("status") ReservationStatus status);

    // ── Panel admin global (S15-01) ─────────────────────────────────────────

    @Query("""
        SELECT r.status, COUNT(r) FROM ReservationEntity r
        WHERE r.reservationDate BETWEEN :from AND :to AND r.deletedAt IS NULL
        GROUP BY r.status
    """)
    List<Object[]> countAllByStatusInRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT r.restaurant_id, COUNT(*) AS cantidad
        FROM reservations r
        WHERE r.reservation_date BETWEEN :from AND :to AND r.deleted_at IS NULL
        GROUP BY r.restaurant_id
        ORDER BY cantidad DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Object[]> topRestaurantsByReservations(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // ── Exportación de reportes (S15-02) ────────────────────────────────────

    List<ReservationEntity> findByRestaurantIdAndReservationDateBetweenOrderByReservationDateAscStartTimeAsc(
            UUID restaurantId, LocalDate from, LocalDate to);
}
