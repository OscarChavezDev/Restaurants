package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID reservationId;
    private String confirmationCode;
    private String customerName;
    private LocalDate reservationDate;
    private BigDecimal amount;
    private String method;
    private String status;
    private String proofImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;
}
