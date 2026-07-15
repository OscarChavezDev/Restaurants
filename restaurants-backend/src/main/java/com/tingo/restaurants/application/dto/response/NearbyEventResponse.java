package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NearbyEventResponse {
    private long id;
    private String name;
    private String startDate;
    private String endDate;
    private String city;
    private String category;
    private Integer availableSpots;
    private boolean soldOut;
}
