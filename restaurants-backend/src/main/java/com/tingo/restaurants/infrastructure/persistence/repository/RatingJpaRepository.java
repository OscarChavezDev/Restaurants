package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
