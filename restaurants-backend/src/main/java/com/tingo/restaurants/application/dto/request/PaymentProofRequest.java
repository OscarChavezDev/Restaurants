package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/** Comprobante de pago que sube el cliente (S12-04). */
@Data
public class PaymentProofRequest {

    @NotNull
    private UUID reservationId;

    @NotNull
    private BigDecimal amount;

    /** YAPE | PLIN | TRANSFERENCIA */
    @NotBlank
    private String method;

    @NotBlank
    private String proofImageUrl;
}
