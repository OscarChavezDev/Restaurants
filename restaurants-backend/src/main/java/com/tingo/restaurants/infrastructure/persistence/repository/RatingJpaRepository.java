package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface RatingJpaRepository extends JpaRepository<RatingEntity, UUID> {

    Page<RatingEntity> findByRestaurantIdOrderByCreatedAtDesc(UUID restaurantId, Pageable pageable);

    long countByRestaurantId(UUID restaurantId);

    long countByRestaurantIdAndScore(UUID restaurantId, int score);

    @Query("SELECT AVG(r.score) FROM RatingEntity r WHERE r.restaurantId = :restaurantId")
    Double getAvgScore(@Param("restaurantId") UUID restaurantId);

    @Query("SELECT AVG(r.foodScore) FROM RatingEntity r WHERE r.restaurantId = :restaurantId")
    Double getAvgFoodScore(@Param("restaurantId") UUID restaurantId);

    @Query("SELECT AVG(r.serviceScore) FROM RatingEntity r WHERE r.restaurantId = :restaurantId")
    Double getAvgServiceScore(@Param("restaurantId") UUID restaurantId);

    @Query("SELECT AVG(r.ambianceScore) FROM RatingEntity r WHERE r.restaurantId = :restaurantId")
    Double getAvgAmbianceScore(@Param("restaurantId") UUID restaurantId);

    boolean existsByUserIdAndReservationId(UUID userId, UUID reservationId);

    List<RatingEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query(value = """
        SELECT date_trunc(:unit, r.created_at) AS periodo, AVG(r.score) AS avgScore
        FROM ratings r
        WHERE r.restaurant_id = :restaurantId
          AND r.created_at BETWEEN :from AND :to
        GROUP BY periodo
        ORDER BY periodo
    """, nativeQuery = true)
    List<Object[]> avgScoreByPeriod(
            @Param("restaurantId") UUID restaurantId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("unit") String unit);

    /** Panel admin global (S15-01): rating promedio de todo el sistema en un rango. */
    @Query("SELECT AVG(r.score) FROM RatingEntity r WHERE r.createdAt BETWEEN :from AND :to")
    Double getGlobalAvgScore(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Exportación de reportes (S15-02): reseñas de un restaurante en un rango. */
    List<RatingEntity> findByRestaurantIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID restaurantId, LocalDateTime from, LocalDateTime to);
}
