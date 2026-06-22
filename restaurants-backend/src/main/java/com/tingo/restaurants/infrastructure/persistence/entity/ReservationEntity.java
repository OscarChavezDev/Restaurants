package com.tingo.restaurants.infrastructure.persistence.entity;

import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "table_id")
    private UUID tableId;

    @Column(name = "section_id")
    private UUID sectionId;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "party_size", nullable = false)
    private int partySize;

    @Column(name = "advance_amount")
    private java.math.BigDecimal advanceAmount;

    @Builder.Default
    @Column(name = "terms_accepted", nullable = false)
    private boolean termsAccepted = false;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String priority = "NORMAL"; // NORMAL | HIGH

    @Builder.Default
    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "NOT_REQUIRED"; // NOT_REQUIRED | PENDING_PAYMENT | PROOF_SUBMITTED | PAYMENT_VERIFIED

    @Builder.Default
    @Column(name = "reminder_24h_sent", nullable = false)
    private boolean reminder24hSent = false;

    @Builder.Default
    @Column(name = "reminder_2h_sent", nullable = false)
    private boolean reminder2hSent = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    @Column(name = "confirmation_code", nullable = false, unique = true, length = 20)
    private String confirmationCode;

    @Column(name = "related_event_id")
    private UUID relatedEventId;

    @Column(name = "related_event_name", length = 200)
    private String relatedEventName;

    @Builder.Default
    @Column(name = "is_event_related", nullable = false)
    private boolean eventRelated = false;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;
}
