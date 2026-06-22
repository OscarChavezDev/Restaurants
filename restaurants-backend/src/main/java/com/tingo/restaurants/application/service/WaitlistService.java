package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.WaitlistRequest;
import com.tingo.restaurants.application.dto.response.WaitlistResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.WaitlistEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.WaitlistJpaRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Lista de espera de reservas (Sprint 11, S11-05). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaitlistService {

    private final WaitlistJpaRepository repository;
    private final OwnershipGuard ownershipGuard;

    @Transactional
    public WaitlistResponse join(WaitlistRequest req, UUID customerId) {
        if (customerId != null && repository.existsByRestaurantIdAndCustomerIdAndReservationDateAndStatus(
                req.getRestaurantId(), customerId, req.getReservationDate(), "WAITING")) {
            throw new IllegalStateException("Ya estás en la lista de espera para esa fecha");
        }
        WaitlistEntity e = WaitlistEntity.builder()
                .restaurantId(req.getRestaurantId())
                .customerId(customerId)
                .customerName(req.getCustomerName())
                .customerEmail(req.getCustomerEmail())
                .customerPhone(req.getCustomerPhone())
                .reservationDate(req.getReservationDate())
                .startTime(req.getStartTime())
                .partySize(req.getPartySize())
                .status("WAITING")
                .build();
        return toResponse(repository.save(e));
    }

    public List<WaitlistResponse> listByRestaurant(UUID restaurantId) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        return repository.findByRestaurantIdAndStatusOrderByCreatedAt(restaurantId, "WAITING")
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void cancel(UUID id, UUID requesterId, boolean isAdmin) {
        WaitlistEntity e = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Anotación no encontrada"));
        boolean isOwner = !isAdmin && isOwnerOf(e.getRestaurantId());
        boolean isCustomer = requesterId != null && requesterId.equals(e.getCustomerId());
        if (!isAdmin && !isOwner && !isCustomer) {
            throw new AccessDeniedException("No puedes modificar esta anotación");
        }
        e.setStatus("CANCELLED");
        repository.save(e);
    }

    private boolean isOwnerOf(UUID restaurantId) {
        try {
            ownershipGuard.assertOwnsRestaurant(restaurantId);
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private WaitlistResponse toResponse(WaitlistEntity e) {
        return WaitlistResponse.builder()
                .id(e.getId())
                .restaurantId(e.getRestaurantId())
                .customerName(e.getCustomerName())
                .customerPhone(e.getCustomerPhone())
                .reservationDate(e.getReservationDate())
                .startTime(e.getStartTime())
                .partySize(e.getPartySize())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
