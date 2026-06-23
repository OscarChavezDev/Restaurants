package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, UUID> {

    // Nativa con CAST explícito: si se pasan todos los filtros en null (sin cast),
    // Postgres no puede inferir el tipo del parámetro y la query falla (mismo
    // problema ya resuelto así en RestaurantJpaRepository.findByFilters).
    @Query(value = """
        SELECT * FROM audit_logs a
        WHERE (CAST(:entityType AS text) IS NULL OR a.entity_type = CAST(:entityType AS text))
          AND (CAST(:action AS text) IS NULL OR a.action = CAST(:action AS text))
          AND (CAST(:from AS timestamp) IS NULL OR a.performed_at >= CAST(:from AS timestamp))
          AND (CAST(:to AS timestamp) IS NULL OR a.performed_at < CAST(:to AS timestamp))
        ORDER BY a.performed_at DESC
    """,
        countQuery = """
        SELECT COUNT(*) FROM audit_logs a
        WHERE (CAST(:entityType AS text) IS NULL OR a.entity_type = CAST(:entityType AS text))
          AND (CAST(:action AS text) IS NULL OR a.action = CAST(:action AS text))
          AND (CAST(:from AS timestamp) IS NULL OR a.performed_at >= CAST(:from AS timestamp))
          AND (CAST(:to AS timestamp) IS NULL OR a.performed_at < CAST(:to AS timestamp))
    """,
        nativeQuery = true)
    Page<AuditLogEntity> search(
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);
}
