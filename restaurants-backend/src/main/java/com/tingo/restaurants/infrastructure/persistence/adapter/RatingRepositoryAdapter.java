package com.tingo.restaurants.infrastructure.persistence.adapter;

import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.RatingStatsResponse;
import com.tingo.restaurants.domain.repository.RatingRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.UserEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RatingRepositoryAdapter implements RatingRepository {

    private final RatingJpaRepository ratingJpaRepository;
    private final UserJpaRepository userJpaRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<RatingResponse> findByRestaurantId(UUID restaurantId, int page, int size) {
        Page<RatingEntity> entityPage = ratingJpaRepository
                .findByRestaurantIdOrderByCreatedAtDesc(restaurantId, PageRequest.of(page, size));

        Set<UUID> userIds = entityPage.getContent().stream()
                .map(RatingEntity::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> userNames = userJpaRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getFullName));

        Page<RatingResponse> responsePage = entityPage.map(r -> RatingResponse.builder()
                .id(r.getId())
                .userName(r.getUserId() != null ? userNames.getOrDefault(r.getUserId(), "Cliente") : "Visitante")
                .score(r.getScore())
                .comment(r.getComment())
                .foodScore(r.getFoodScore())
                .serviceScore(r.getServiceScore())
                .ambianceScore(r.getAmbianceScore())
                .isVerified(r.isVerified())
                .createdAt(r.getCreatedAt())
                .build());

        return PagedResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public RatingStatsResponse getStatsByRestaurantId(UUID restaurantId) {
        long total = ratingJpaRepository.countByRestaurantId(restaurantId);

        Double avgScore = ratingJpaRepository.getAvgScore(restaurantId);
        Double avgFood = ratingJpaRepository.getAvgFoodScore(restaurantId);
        Double avgService = ratingJpaRepository.getAvgServiceScore(restaurantId);
        Double avgAmbiance = ratingJpaRepository.getAvgAmbianceScore(restaurantId);

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            distribution.put(i, ratingJpaRepository.countByRestaurantIdAndScore(restaurantId, i));
        }

        return RatingStatsResponse.builder()
                .avgScore(avgScore != null ? avgScore : 0.0)
                .avgFoodScore(avgFood)
                .avgServiceScore(avgService)
                .avgAmbianceScore(avgAmbiance)
                .totalRatings(total)
                .distribution(distribution)
                .build();
    }
}
