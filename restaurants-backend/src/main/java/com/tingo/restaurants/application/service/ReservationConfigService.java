package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.ReservationConfigRequest;
import com.tingo.restaurants.application.dto.response.ReservationConfigResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationConfigEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.DishJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationConfigJpaRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/** Parametrización de reservas por restaurante (Sprint 10) y cálculos derivados. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationConfigService {

    private final ReservationConfigJpaRepository configRepository;
    private final DishJpaRepository dishRepository;
    private final OwnershipGuard ownershipGuard;

    /** Devuelve la config persistida o una con valores por defecto (sin guardarla). */
    public ReservationConfigEntity getOrDefault(UUID restaurantId) {
        return configRepository.findByRestaurantId(restaurantId)
                .orElseGet(() -> ReservationConfigEntity.builder().restaurantId(restaurantId).build());
    }

    public ReservationConfigResponse getByRestaurant(UUID restaurantId) {
        ReservationConfigEntity c = getOrDefault(restaurantId);
        return toResponse(c, restaurantId);
    }

    @Transactional
    public ReservationConfigResponse save(UUID restaurantId, ReservationConfigRequest req) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        ReservationConfigEntity c = configRepository.findByRestaurantId(restaurantId)
                .orElseGet(() -> ReservationConfigEntity.builder().restaurantId(restaurantId).build());

        c.setMinAdvanceHours(req.getMinAdvanceHours());
        c.setCancellationDeadlineHours(req.getCancellationDeadlineHours());
        c.setPersonsPerTable(Math.max(1, req.getPersonsPerTable()));
        c.setRequiresAdvancePayment(req.isRequiresAdvancePayment());
        c.setSmallGroupMaxPersons(req.getSmallGroupMaxPersons());
        c.setSmallGroupAdvanceType("FIXED_AMOUNT".equals(req.getSmallGroupAdvanceType()) ? "FIXED_AMOUNT" : "CHEAPEST_DISH");
        c.setSmallGroupFixedAmount(req.getSmallGroupFixedAmount() != null ? req.getSmallGroupFixedAmount() : BigDecimal.ZERO);
        c.setLargeGroupAdvancePercent(req.getLargeGroupAdvancePercent());
        c.setTermsAndConditions(req.getTermsAndConditions());
        c.setPaymentInfo(req.getPaymentInfo());
        c.setPaymentQrUrl(req.getPaymentQrUrl());
        c.setAllowSectionSelection(req.isAllowSectionSelection());

        return toResponse(configRepository.save(c), restaurantId);
    }

    /** Mesas estimadas según personas / capacidad por mesa (S10-02). */
    public int estimateTables(ReservationConfigEntity cfg, int partySize) {
        int perTable = Math.max(1, cfg.getPersonsPerTable());
        return (int) Math.ceil((double) partySize / perTable);
    }

    /**
     * Adelanto a cobrar (S10-03). Sin pre-pedido (diferido), el grupo grande se
     * estima como % sobre (plato más barato × personas).
     */
    public BigDecimal computeAdvance(ReservationConfigEntity cfg, int partySize, UUID restaurantId) {
        if (!cfg.isRequiresAdvancePayment()) return BigDecimal.ZERO;

        if (partySize <= cfg.getSmallGroupMaxPersons()) {
            if ("FIXED_AMOUNT".equals(cfg.getSmallGroupAdvanceType())) {
                return scale(cfg.getSmallGroupFixedAmount());
            }
            BigDecimal cheapest = dishRepository.minAvailablePrice(restaurantId);
            return scale(cheapest != null ? cheapest : BigDecimal.ZERO);
        }

        BigDecimal cheapest = dishRepository.minAvailablePrice(restaurantId);
        if (cheapest == null) return BigDecimal.ZERO;
        BigDecimal base = cheapest.multiply(BigDecimal.valueOf(partySize));
        return scale(base.multiply(BigDecimal.valueOf(cfg.getLargeGroupAdvancePercent()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
    }

    private BigDecimal scale(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v.setScale(2, RoundingMode.HALF_UP);
    }

    private ReservationConfigResponse toResponse(ReservationConfigEntity c, UUID restaurantId) {
        return ReservationConfigResponse.builder()
                .minAdvanceHours(c.getMinAdvanceHours())
                .cancellationDeadlineHours(c.getCancellationDeadlineHours())
                .personsPerTable(c.getPersonsPerTable())
                .requiresAdvancePayment(c.isRequiresAdvancePayment())
                .smallGroupMaxPersons(c.getSmallGroupMaxPersons())
                .smallGroupAdvanceType(c.getSmallGroupAdvanceType())
                .smallGroupFixedAmount(c.getSmallGroupFixedAmount())
                .largeGroupAdvancePercent(c.getLargeGroupAdvancePercent())
                .termsAndConditions(c.getTermsAndConditions())
                .paymentInfo(c.getPaymentInfo())
                .paymentQrUrl(c.getPaymentQrUrl())
                .allowSectionSelection(c.isAllowSectionSelection())
                .cheapestDishPrice(dishRepository.minAvailablePrice(restaurantId))
                .build();
    }
}
