package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.CustomerHistoryResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.ReservationResponse;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Historial del cliente (S13-02): próximas reservas, restaurantes visitados, reseñas, cocina favorita y gasto. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerHistoryService {

    private final ReservationJpaRepository reservationJpaRepository;
    private final RatingJpaRepository ratingJpaRepository;
    private final RestaurantJpaRepository restaurantJpaRepository;

    public CustomerHistoryResponse getHistory(UUID customerId) {
        List<ReservationEntity> proximas = reservationJpaRepository
                .findByCustomerIdAndStatusAndReservationDateGreaterThanEqualOrderByReservationDateAscStartTimeAsc(
                        customerId, ReservationStatus.CONFIRMED, LocalDate.now());
        List<ReservationEntity> completadas = reservationJpaRepository
                .findByCustomerIdAndStatus(customerId, ReservationStatus.COMPLETED);
        List<RatingEntity> misRatings = ratingJpaRepository.findByUserIdOrderByCreatedAtDesc(customerId);

        Set<UUID> restaurantIds = new HashSet<>();
        proximas.forEach(r -> restaurantIds.add(r.getRestaurantId()));
        completadas.forEach(r -> restaurantIds.add(r.getRestaurantId()));
        misRatings.forEach(r -> restaurantIds.add(r.getRestaurantId()));

        Map<UUID, RestaurantEntity> restaurants = restaurantJpaRepository.findAllById(restaurantIds).stream()
                .collect(Collectors.toMap(RestaurantEntity::getId, Function.identity()));

        Map<UUID, Long> visitCountByRestaurant = completadas.stream()
                .collect(Collectors.groupingBy(ReservationEntity::getRestaurantId, Collectors.counting()));

        List<CustomerHistoryResponse.RestaurantSummary> visitados = visitCountByRestaurant.entrySet().stream()
                .map(e -> toSummary(restaurants.get(e.getKey()), e.getValue()))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingLong(CustomerHistoryResponse.RestaurantSummary::getVisitCount).reversed())
                .toList();

        CustomerHistoryResponse.RestaurantSummary masFrecuente = visitados.isEmpty() ? null : visitados.get(0);

        List<String> cocinaFavorita = visitCountByRestaurant.entrySet().stream()
                .flatMap(e -> {
                    RestaurantEntity r = restaurants.get(e.getKey());
                    if (r == null || r.getCategories() == null) return Stream.<Map.Entry<String, Long>>empty();
                    return r.getCategories().stream().map(c -> Map.entry(c.getName(), e.getValue()));
                })
                .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.summingLong(Map.Entry::getValue)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .limit(3)
                .toList();

        BigDecimal gastoEstimado = reservationJpaRepository
                .sumAdvanceAmountByCustomerAndStatus(customerId, ReservationStatus.COMPLETED);

        return CustomerHistoryResponse.builder()
                .proximasReservas(proximas.stream().map(r -> toReservationResponse(r, restaurants)).toList())
                .restaurantesVisitados(visitados)
                .misResenas(misRatings.stream().map(r -> toRatingResponse(r, restaurants)).toList())
                .tiposCocinaFavoritos(cocinaFavorita)
                .restauranteMasFrecuente(masFrecuente)
                .gastoEstimado(gastoEstimado != null ? gastoEstimado : BigDecimal.ZERO)
                .build();
    }

    private CustomerHistoryResponse.RestaurantSummary toSummary(RestaurantEntity r, long visitCount) {
        if (r == null) return null;
        return CustomerHistoryResponse.RestaurantSummary.builder()
                .id(r.getId())
                .name(r.getName())
                .slug(r.getSlug())
                .logoUrl(r.getLogoUrl())
                .visitCount(visitCount)
                .build();
    }

    private ReservationResponse toReservationResponse(ReservationEntity r, Map<UUID, RestaurantEntity> restaurants) {
        RestaurantEntity restaurant = restaurants.get(r.getRestaurantId());
        return ReservationResponse.builder()
                .id(r.getId())
                .restaurantId(r.getRestaurantId())
                .restaurantName(restaurant != null ? restaurant.getName() : null)
                .customerName(r.getCustomerName())
                .customerEmail(r.getCustomerEmail())
                .customerPhone(r.getCustomerPhone())
                .reservationDate(r.getReservationDate())
                .startTime(r.getStartTime())
                .endTime(r.getEndTime())
                .partySize(r.getPartySize())
                .sectionId(r.getSectionId())
                .advanceAmount(r.getAdvanceAmount())
                .priority(r.getPriority())
                .paymentStatus(r.getPaymentStatus())
                .status(r.getStatus())
                .notes(r.getNotes())
                .specialRequests(r.getSpecialRequests())
                .confirmationCode(r.getConfirmationCode())
                .isEventRelated(r.isEventRelated())
                .relatedEventName(r.getRelatedEventName())
                .confirmedAt(r.getConfirmedAt())
                .cancelledAt(r.getCancelledAt())
                .cancellationReason(r.getCancellationReason())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private RatingResponse toRatingResponse(RatingEntity r, Map<UUID, RestaurantEntity> restaurants) {
        RestaurantEntity restaurant = restaurants.get(r.getRestaurantId());
        return RatingResponse.builder()
                .id(r.getId())
                .restaurantId(r.getRestaurantId())
                .restaurantName(restaurant != null ? restaurant.getName() : null)
                .score(r.getScore())
                .comment(r.getComment())
                .foodScore(r.getFoodScore())
                .serviceScore(r.getServiceScore())
                .ambianceScore(r.getAmbianceScore())
                .isVerified(r.isVerified())
                .createdAt(r.getCreatedAt())
                .ownerReply(r.getOwnerReply())
                .ownerReplyAt(r.getOwnerReplyAt())
                .build();
    }
}
