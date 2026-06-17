package com.tingo.restaurants.domain.repository;

import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.RatingStatsResponse;

import java.util.UUID;

public interface RatingRepository {
    PagedResponse<RatingResponse> findByRestaurantId(UUID restaurantId, int page, int size);
    RatingStatsResponse getStatsByRestaurantId(UUID restaurantId);
}
