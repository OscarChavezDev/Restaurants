package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservationResponse {

    private UUID id;
    private UUID restaurantId;
    private String restaurantName;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private LocalDate reservationDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private int partySize;
    private UUID sectionId;
    private java.math.BigDecimal advanceAmount;
    private String priority;
    private String paymentStatus;
    private java.math.BigDecimal orderTotal;
    private java.util.List<ReservationOrderItemResponse> orderItems;
    private ReservationStatus status;
    private String notes;
    private String specialRequests;
    private String confirmationCode;
    private boolean isEventRelated;
    private String relatedEventName;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime createdAt;
}
