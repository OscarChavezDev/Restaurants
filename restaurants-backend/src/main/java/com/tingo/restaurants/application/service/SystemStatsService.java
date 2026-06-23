package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.SystemStatsResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.PaymentJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** Panel de administrador global (S15-01): métricas agregadas de todo el sistema. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SystemStatsService {

    private final RestaurantJpaRepository restaurantJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final ReservationJpaRepository reservationJpaRepository;
    private final PaymentJpaRepository paymentJpaRepository;
    private final RatingJpaRepository ratingJpaRepository;

    public SystemStatsResponse getSystemStats(LocalDate from, LocalDate to) {
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(90);
        LocalDateTime fromDateTime = effectiveFrom.atStartOfDay();
        LocalDateTime toDateTime = effectiveTo.plusDays(1).atStartOfDay();

        List<SystemStatsResponse.CountByKey> restaurantsByStatus = toCountByKey(restaurantJpaRepository.countByStatus());
        List<SystemStatsResponse.CountByKey> usersByRole = toCountByKey(userJpaRepository.countByRole());
        List<SystemStatsResponse.CountByKey> reservationsByStatus =
                toCountByKey(reservationJpaRepository.countAllByStatusInRange(effectiveFrom, effectiveTo));

        BigDecimal ingresoAdelantosTotal = paymentJpaRepository.sumAllVerifiedAmount(fromDateTime, toDateTime);
        Double avgRating = ratingJpaRepository.getGlobalAvgScore(fromDateTime, toDateTime);

        List<Object[]> topRows = reservationJpaRepository.topRestaurantsByReservations(effectiveFrom, effectiveTo);
        List<UUID> topIds = topRows.stream().map(row -> asUuid(row[0])).toList();
        Map<UUID, String> names = restaurantJpaRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(RestaurantEntity::getId, RestaurantEntity::getName));

        List<SystemStatsResponse.TopRestaurant> topRestaurants = topRows.stream()
                .map(row -> {
                    UUID id = asUuid(row[0]);
                    return SystemStatsResponse.TopRestaurant.builder()
                            .id(id)
                            .name(names.getOrDefault(id, "—"))
                            .totalReservas(((Number) row[1]).longValue())
                            .build();
                })
                .toList();

        return SystemStatsResponse.builder()
                .restaurantsByStatus(restaurantsByStatus)
                .usersByRole(usersByRole)
                .reservationsByStatus(reservationsByStatus)
                .ingresoAdelantosTotal(ingresoAdelantosTotal != null ? ingresoAdelantosTotal : BigDecimal.ZERO)
                .avgRatingGlobal(avgRating != null ? Math.round(avgRating * 10) / 10.0 : 0.0)
                .topRestaurants(topRestaurants)
                .build();
    }

    private List<SystemStatsResponse.CountByKey> toCountByKey(List<Object[]> rows) {
        return rows.stream()
                .map(row -> SystemStatsResponse.CountByKey.builder()
                        .key(row[0].toString())
                        .cantidad(((Number) row[1]).longValue())
                        .build())
                .toList();
    }

    private UUID asUuid(Object value) {
        return value instanceof UUID u ? u : UUID.fromString(value.toString());
    }
}
