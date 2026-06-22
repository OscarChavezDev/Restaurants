package com.tingo.restaurants.domain.repository;

import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantRepository {

    Restaurant save(Restaurant restaurant);

    Optional<Restaurant> findById(UUID id);

    Optional<Restaurant> findBySlug(String slug);

    Page<Restaurant> findAll(Pageable pageable);

    Page<Restaurant> findByStatus(RestaurantStatus status, Pageable pageable);

    Page<Restaurant> findByFilters(String name, String city, String categoryId, String priceRange,
                                   RestaurantStatus status, Pageable pageable);

    List<Restaurant> findNearby(BigDecimal latitude, BigDecimal longitude, double radiusKm);

    List<Restaurant> findNearbyEvent(UUID eventId, double radiusKm);

    Page<Restaurant> findByOwnerId(UUID ownerId, Pageable pageable);

    void deleteById(UUID id);

    boolean existsBySlug(String slug);

    boolean existsByEmail(String email);
}
