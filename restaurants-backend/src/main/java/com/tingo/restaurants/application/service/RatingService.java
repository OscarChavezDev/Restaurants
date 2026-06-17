package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.RatingStatsResponse;
import com.tingo.restaurants.domain.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RatingService {

    private final RatingRepository ratingRepository;

    public PagedResponse<RatingResponse> findByRestaurant(UUID restaurantId, int page, int size) {
        return ratingRepository.findByRestaurantId(restaurantId, page, size);
    }

    public RatingStatsResponse getStatsByRestaurant(UUID restaurantId) {
        return ratingRepository.getStatsByRestaurantId(restaurantId);
    }
}
