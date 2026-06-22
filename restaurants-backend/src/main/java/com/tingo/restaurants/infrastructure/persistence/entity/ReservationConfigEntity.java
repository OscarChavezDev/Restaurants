package com.tingo.restaurants.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Reglas de reserva que define cada dueño para su restaurante (Sprint 10). */
@Entity
@Table(name = "reservation_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "restaurant_id", nullable = false, unique = true)
    private UUID restaurantId;

    @Builder.Default
    @Column(name = "min_advance_hours", nullable = false)
    private int minAdvanceHours = 2;

    @Builder.Default
    @Column(name = "cancellation_deadline_hours", nullable = false)
    private int cancellationDeadlineHours = 4;

    @Builder.Default
    @Column(name = "persons_per_table", nullable = false)
    private int personsPerTable = 4;

    @Builder.Default
    @Column(name = "requires_advance_payment", nullable = false)
    private boolean requiresAdvancePayment = false;

    @Builder.Default
    @Column(name = "small_group_max_persons", nullable = false)
    private int smallGroupMaxPersons = 6;

    @Builder.Default
    @Column(name = "small_group_advance_type", nullable = false, length = 20)
    private String smallGroupAdvanceType = "CHEAPEST_DISH"; // CHEAPEST_DISH | FIXED_AMOUNT

    @Builder.Default
    @Column(name = "small_group_fixed_amount", nullable = false)
    private BigDecimal smallGroupFixedAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "large_group_advance_percent", nullable = false)
    private int largeGroupAdvancePercent = 50;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    /** Instrucciones de pago: cuenta / Yape / Plin (S12-02). */
    @Column(name = "payment_info", columnDefinition = "TEXT")
    private String paymentInfo;

    /** QR de pago del restaurante (imagen subida a Cloudinary). */
    @Column(name = "payment_qr_url", length = 500)
    private String paymentQrUrl;

    @Builder.Default
    @Column(name = "allow_section_selection", nullable = false)
    private boolean allowSectionSelection = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
