package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class RatingStatsResponse {
    private double avgScore;
    private Double avgFoodScore;
    private Double avgServiceScore;
    private Double avgAmbianceScore;
    private long totalRatings;
    private Map<Integer, Long> distribution;
}
