package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.math.BigDecimal;

/** Reglas de reserva que edita el dueño (Sprint 10, S10-01). */
@Data
public class ReservationConfigRequest {

    @Min(0) @Max(168)
    private int minAdvanceHours = 2;

    @Min(0) @Max(168)
    private int cancellationDeadlineHours = 4;

    @Min(1) @Max(50)
    private int personsPerTable = 4;

    private boolean requiresAdvancePayment = false;

    @Min(1) @Max(100)
    private int smallGroupMaxPersons = 6;

    /** CHEAPEST_DISH | FIXED_AMOUNT */
    private String smallGroupAdvanceType = "CHEAPEST_DISH";

    private BigDecimal smallGroupFixedAmount = BigDecimal.ZERO;

    @Min(0) @Max(100)
    private int largeGroupAdvancePercent = 50;

    private String termsAndConditions;

    private String paymentInfo;

    private String paymentQrUrl;

    private boolean allowSectionSelection = true;
}
