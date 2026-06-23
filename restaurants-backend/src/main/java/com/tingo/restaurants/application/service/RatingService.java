package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RatingResponse;
import com.tingo.restaurants.application.dto.response.RatingStatsResponse;
import com.tingo.restaurants.domain.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RatingService {

    private final RatingRepository ratingRepository;
    private final com.tingo.restaurants.infrastructure.persistence.repository.RatingJpaRepository ratingJpaRepository;
    private final com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository reservationJpaRepository;
    private final com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository restaurantJpaRepository;
    private final com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository userJpaRepository;

    public PagedResponse<RatingResponse> findByRestaurant(UUID restaurantId, int page, int size) {
        return ratingRepository.findByRestaurantId(restaurantId, page, size);
    }

    public RatingStatsResponse getStatsByRestaurant(UUID restaurantId) {
        return ratingRepository.getStatsByRestaurantId(restaurantId);
    }

    @Transactional
    public RatingResponse createRating(UUID userId, com.tingo.restaurants.application.dto.request.CreateRatingRequest request) {
        UUID finalRestaurantId = null;
        String finalCustomerName = "Anónimo";
        boolean isVerified = false;

        if (request.getReservationId() != null) {
            com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity reservation = reservationJpaRepository.findById(request.getReservationId())
                    .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

            if (userId != null && reservation.getCustomerId() != null && !reservation.getCustomerId().equals(userId)) {
                throw new IllegalArgumentException("No puedes calificar una reserva que no es tuya");
            }

            if (reservation.getStatus() != com.tingo.restaurants.domain.model.enums.ReservationStatus.COMPLETED) {
                throw new IllegalArgumentException("Solo puedes calificar reservas completadas");
            }

            if (userId != null) {
                if (ratingJpaRepository.existsByUserIdAndReservationId(userId, request.getReservationId())) {
                    throw new IllegalArgumentException("Ya has calificado esta reserva");
                }
            }

            finalRestaurantId = reservation.getRestaurantId();
            finalCustomerName = reservation.getCustomerName();
            isVerified = userId != null;
        } else if (request.getRestaurantId() != null) {
            finalRestaurantId = request.getRestaurantId();
            if (userId != null) {
                finalCustomerName = userJpaRepository.findById(userId)
                    .map(com.tingo.restaurants.infrastructure.persistence.entity.UserEntity::getFullName)
                    .orElse("Anónimo");
            }
            // Las reseñas directas no son verificadas
            isVerified = false;
        } else {
            throw new IllegalArgumentException("Debe proporcionar una reserva o un restaurante");
        }

        com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity entity = com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity.builder()
                .id(UUID.randomUUID())
                .restaurantId(finalRestaurantId)
                .userId(userId)
                .reservationId(request.getReservationId())
                .score(request.getScore())
                .comment(request.getComment())
                .foodScore(request.getFoodScore())
                .serviceScore(request.getServiceScore())
                .ambianceScore(request.getAmbianceScore())
                .verified(isVerified)
                .build();

        com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity saved = ratingJpaRepository.save(entity);

        // Update restaurant stats
        com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity restaurant = restaurantJpaRepository.findById(finalRestaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurante no encontrado"));
        
        Double avg = ratingJpaRepository.getAvgScore(restaurant.getId());
        long total = ratingJpaRepository.countByRestaurantId(restaurant.getId());
        restaurant.setAvgRating(avg != null ? java.math.BigDecimal.valueOf(avg) : java.math.BigDecimal.ZERO);
        restaurant.setTotalRatings((int) total);
        restaurantJpaRepository.save(restaurant);

        return RatingResponse.builder()
                .id(saved.getId())
                .restaurantId(restaurant.getId())
                .restaurantName(restaurant.getName())
                .userName(finalCustomerName)
                .score(saved.getScore())
                .comment(saved.getComment())
                .foodScore(saved.getFoodScore())
                .serviceScore(saved.getServiceScore())
                .ambianceScore(saved.getAmbianceScore())
                .isVerified(saved.isVerified())
                .createdAt(java.time.LocalDateTime.now())
                .build();
    }

    public PagedResponse<RatingResponse> getRatingsByUser(UUID userId, int page, int size) {
        org.springframework.data.domain.Page<com.tingo.restaurants.infrastructure.persistence.entity.RatingEntity> entityPage = 
            ratingJpaRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(page, size));
        
        java.util.List<RatingResponse> content = entityPage.getContent().stream()
            .map(entity -> {
                String rName = restaurantJpaRepository.findById(entity.getRestaurantId())
                    .map(com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity::getName)
                    .orElse("Restaurante Desconocido");
                return RatingResponse.builder()
                    .id(entity.getId())
                    .restaurantId(entity.getRestaurantId())
                    .restaurantName(rName)
                    .userName("Tú")
                    .score(entity.getScore())
                    .comment(entity.getComment())
                    .foodScore(entity.getFoodScore())
                    .serviceScore(entity.getServiceScore())
                    .ambianceScore(entity.getAmbianceScore())
                    .isVerified(entity.isVerified())
                    .createdAt(entity.getCreatedAt())
                    .ownerReply(entity.getOwnerReply())
                    .ownerReplyAt(entity.getOwnerReplyAt())
                    .build();
            })
            .collect(java.util.stream.Collectors.toList());

        return PagedResponse.<RatingResponse>builder()
            .content(content)
            .page(entityPage.getNumber())
            .size(entityPage.getSize())
            .totalElements(entityPage.getTotalElements())
            .totalPages(entityPage.getTotalPages())
            .last(entityPage.isLast())
            .first(entityPage.isFirst())
            .build();
    }
}
