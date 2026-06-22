package com.tingo.restaurants.domain.model;

import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    private UUID id;
    private UUID restaurantId;
    private UUID customerId;
    private UUID tableId;
    private UUID sectionId;

    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private LocalDate reservationDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private int partySize;
    private java.math.BigDecimal advanceAmount;
    private boolean termsAccepted;
    private String priority;
    private String paymentStatus;
    private ReservationStatus status;
    private String notes;
    private String specialRequests;
    private String confirmationCode;

    private UUID relatedEventId;
    private String relatedEventName;
    private boolean isEventRelated;

    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public boolean isPending() {
        return status == ReservationStatus.PENDING;
    }

    public boolean isCancellable() {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    public boolean isConfirmable() {
        return status == ReservationStatus.PENDING;
    }

    public Reservation confirm() {
        if (!isConfirmable()) {
            throw new IllegalStateException("La reserva en estado " + status + " no puede ser confirmada");
        }
        return this.toBuilder()
                .status(ReservationStatus.CONFIRMED)
                .confirmedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public Reservation cancel(String reason) {
        if (!isCancellable()) {
            throw new IllegalStateException("La reserva en estado " + status + " no puede ser cancelada");
        }
        return this.toBuilder()
                .status(ReservationStatus.CANCELLED)
                .cancelledAt(LocalDateTime.now())
                .cancellationReason(reason)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public Reservation complete() {
        if (status != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Solo se puede completar una reserva CONFIRMED (estado actual: " + status + ")");
        }
        return this.toBuilder()
                .status(ReservationStatus.COMPLETED)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public Reservation markNoShow() {
        if (status != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Solo se puede marcar no-show desde CONFIRMED (estado actual: " + status + ")");
        }
        return this.toBuilder()
                .status(ReservationStatus.NO_SHOW)
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
