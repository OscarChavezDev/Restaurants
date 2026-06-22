package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantHolidayEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RestaurantHolidayJpaRepository extends JpaRepository<RestaurantHolidayEntity, UUID> {
    List<RestaurantHolidayEntity> findByRestaurantIdOrderByHolidayDate(UUID restaurantId);
    List<RestaurantHolidayEntity> findByRestaurantIdAndHolidayDateGreaterThanEqualOrderByHolidayDate(UUID restaurantId, LocalDate from);
    boolean existsByRestaurantIdAndHolidayDate(UUID restaurantId, LocalDate holidayDate);
}
