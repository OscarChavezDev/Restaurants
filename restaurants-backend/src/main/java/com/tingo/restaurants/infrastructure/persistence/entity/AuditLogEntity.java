package com.tingo.restaurants.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/** Registro de acciones críticas del sistema (S15-03). */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // RESERVATION | PAYMENT | RESTAURANT | USER

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(nullable = false, length = 50)
    private String action; // CANCEL_RESERVATION | VERIFY_PAYMENT | ...

    @Column(name = "performed_by")
    private UUID performedBy;

    @Column(name = "performed_by_name", length = 150)
    private String performedByName;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @PrePersist
    void onCreate() {
        if (performedAt == null) performedAt = LocalDateTime.now();
    }
}
