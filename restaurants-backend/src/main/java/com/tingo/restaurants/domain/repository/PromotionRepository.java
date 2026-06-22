package com.tingo.restaurants.domain.repository;

import com.tingo.restaurants.domain.model.Promotion;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromotionRepository {
    Promotion save(Promotion promotion);
    Optional<Promotion> findById(UUID id);
    List<Promotion> findByRestaurantId(UUID restaurantId);
    List<Promotion> findActiveByRestaurantId(UUID restaurantId);
    List<Promotion> findShowcase();
    void deleteById(UUID id);
}
