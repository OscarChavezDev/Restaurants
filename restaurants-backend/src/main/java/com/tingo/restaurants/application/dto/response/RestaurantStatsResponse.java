package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/** Estadísticas del dueño (S13-01): reservas, no-show, ingresos, platos, rating y ocupación. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RestaurantStatsResponse {

    private List<PeriodCount> reservasPorPeriodo;
    private double tasaNoShow;
    private BigDecimal ingresoAdelantos;
    private List<DishCount> platosMasPedidos;
    private List<PeriodAvgScore> ratingPromedioEnElTiempo;
    private List<SectionCount> ocupacionPorSeccion;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class PeriodCount {
        private String periodo;
        private long cantidad;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class DishCount {
        private String dishName;
        private long cantidad;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class PeriodAvgScore {
        private String periodo;
        private double avgScore;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class SectionCount {
        private String sectionName;
        private long cantidad;
    }
}
