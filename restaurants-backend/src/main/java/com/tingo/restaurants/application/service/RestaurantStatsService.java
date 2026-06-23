package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.RestaurantStatsResponse;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import com.tingo.restaurants.infrastructure.persistence.repository.PaymentJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationOrderItemJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Estadísticas del dueño (S13-01): reservas por período, no-show, ingresos, platos, rating y ocupación. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantStatsService {

    private final ReservationJpaRepository reservationJpaRepository;
    private final PaymentJpaRepository paymentJpaRepository;
    private final ReservationOrderItemJpaRepository orderItemJpaRepository;
    private final RatingJpaRepository ratingJpaRepository;

    public RestaurantStatsResponse getStats(UUID restaurantId, LocalDate from, LocalDate to, String groupBy) {
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(90);
        String unit = normalizeUnit(groupBy);
        LocalDateTime fromDateTime = effectiveFrom.atStartOfDay();
        LocalDateTime toDateTime = effectiveTo.plusDays(1).atStartOfDay();

        List<RestaurantStatsResponse.PeriodCount> reservasPorPeriodo = reservationJpaRepository
                .countReservationsByPeriod(restaurantId, effectiveFrom, effectiveTo, unit).stream()
                .map(row -> RestaurantStatsResponse.PeriodCount.builder()
                        .periodo(formatPeriod(row[0]))
                        .cantidad(((Number) row[1]).longValue())
                        .build())
                .toList();

        long noShow = reservationJpaRepository.countByRestaurantIdAndReservationDateBetweenAndStatus(
                restaurantId, effectiveFrom, effectiveTo, ReservationStatus.NO_SHOW);
        long confirmed = reservationJpaRepository.countByRestaurantIdAndReservationDateBetweenAndStatus(
                restaurantId, effectiveFrom, effectiveTo, ReservationStatus.CONFIRMED);
        long completed = reservationJpaRepository.countByRestaurantIdAndReservationDateBetweenAndStatus(
                restaurantId, effectiveFrom, effectiveTo, ReservationStatus.COMPLETED);
        long relevant = noShow + confirmed + completed;
        double tasaNoShow = relevant > 0 ? Math.round(noShow * 1000.0 / relevant) / 10.0 : 0.0;

        BigDecimal ingresoAdelantos = paymentJpaRepository.sumVerifiedAmountByRestaurant(restaurantId, fromDateTime, toDateTime);

        List<RestaurantStatsResponse.DishCount> platosMasPedidos = orderItemJpaRepository
                .topDishesByRestaurant(restaurantId, effectiveFrom, effectiveTo).stream()
                .map(row -> RestaurantStatsResponse.DishCount.builder()
                        .dishName((String) row[0])
                        .cantidad(((Number) row[1]).longValue())
                        .build())
                .toList();

        List<RestaurantStatsResponse.PeriodAvgScore> ratingPromedioEnElTiempo = ratingJpaRepository
                .avgScoreByPeriod(restaurantId, fromDateTime, toDateTime, unit).stream()
                .map(row -> RestaurantStatsResponse.PeriodAvgScore.builder()
                        .periodo(formatPeriod(row[0]))
                        .avgScore(row[1] != null ? Math.round(((Number) row[1]).doubleValue() * 10) / 10.0 : 0.0)
                        .build())
                .toList();

        List<RestaurantStatsResponse.SectionCount> ocupacionPorSeccion = reservationJpaRepository
                .occupancyBySection(restaurantId, effectiveFrom, effectiveTo).stream()
                .map(row -> RestaurantStatsResponse.SectionCount.builder()
                        .sectionName((String) row[0])
                        .cantidad(((Number) row[1]).longValue())
                        .build())
                .toList();

        return RestaurantStatsResponse.builder()
                .reservasPorPeriodo(reservasPorPeriodo)
                .tasaNoShow(tasaNoShow)
                .ingresoAdelantos(ingresoAdelantos != null ? ingresoAdelantos : BigDecimal.ZERO)
                .platosMasPedidos(platosMasPedidos)
                .ratingPromedioEnElTiempo(ratingPromedioEnElTiempo)
                .ocupacionPorSeccion(ocupacionPorSeccion)
                .build();
    }

    private String normalizeUnit(String groupBy) {
        if (groupBy == null) return "day";
        return switch (groupBy.toLowerCase()) {
            case "week" -> "week";
            case "month" -> "month";
            default -> "day";
        };
    }

    /** Las filas nativas de date_trunc llegan como java.sql.Timestamp; se exponen como fecha ISO (yyyy-MM-dd). */
    private String formatPeriod(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.toLocalDateTime().toLocalDate().toString();
        }
        return value != null ? value.toString() : null;
    }
}
