package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/** Config de reservas + datos derivados que el frontend usa para estimar el adelanto. */
@Getter
@Builder
public class ReservationConfigResponse {
    private int minAdvanceHours;
    private int cancellationDeadlineHours;
    private int personsPerTable;
    private boolean requiresAdvancePayment;
    private int smallGroupMaxPersons;
    private String smallGroupAdvanceType;
    private BigDecimal smallGroupFixedAmount;
    private int largeGroupAdvancePercent;
    private String termsAndConditions;
    private String paymentInfo;
    private String paymentQrUrl;
    private boolean allowSectionSelection;

    /** Precio del plato más económico (para estimar el adelanto en el frontend). */
    private BigDecimal cheapestDishPrice;
}
