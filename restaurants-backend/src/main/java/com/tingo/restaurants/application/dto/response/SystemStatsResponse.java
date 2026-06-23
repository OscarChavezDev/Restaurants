package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Panel de administrador global (S15-01): métricas agregadas de todo el sistema. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SystemStatsResponse {

    private List<CountByKey> restaurantsByStatus;
    private List<CountByKey> usersByRole;
    private List<CountByKey> reservationsByStatus;
    private BigDecimal ingresoAdelantosTotal;
    private double avgRatingGlobal;
    private List<TopRestaurant> topRestaurants;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class CountByKey {
        private String key;
        private long cantidad;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class TopRestaurant {
        private UUID id;
        private String name;
        private long totalReservas;
    }
}
