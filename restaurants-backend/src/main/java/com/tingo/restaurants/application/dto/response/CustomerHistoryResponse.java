package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Historial del cliente (S13-02), mostrado en la sección de perfil. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerHistoryResponse {

    private List<ReservationResponse> proximasReservas;
    private List<RestaurantSummary> restaurantesVisitados;
    private List<RatingResponse> misResenas;
    private List<String> tiposCocinaFavoritos;
    private RestaurantSummary restauranteMasFrecuente;
    private BigDecimal gastoEstimado;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class RestaurantSummary {
        private UUID id;
        private String name;
        private String slug;
        private String logoUrl;
        private long visitCount;
    }
}
