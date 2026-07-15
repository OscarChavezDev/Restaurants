package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class NearbyLodgingResponse {
    private long id;
    private String name;
    private String type;
    private String city;
    private BigDecimal priceFrom;
    private String photoUrl;
    private BigDecimal distanceKm;
}
