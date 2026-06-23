package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.AuditLogResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.AuditLogEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.AuditLogJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/** Logs de auditoría (S15-03): quién canceló una reserva, quién verificó un pago, etc. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogJpaRepository auditLogRepository;
    private final UserJpaRepository userJpaRepository;

    @Transactional
    public void record(String entityType, UUID entityId, String action, UUID performedBy, String detail) {
        String performedByName = performedBy != null
                ? userJpaRepository.findById(performedBy).map(u -> u.getFullName()).orElse(null)
                : null;
        auditLogRepository.save(AuditLogEntity.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .performedByName(performedByName)
                .detail(detail)
                .build());
    }

    public PagedResponse<AuditLogResponse> search(String entityType, String action, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return PagedResponse.from(auditLogRepository.search(entityType, action, from, to, pageable).map(this::toResponse));
    }

    private AuditLogResponse toResponse(AuditLogEntity a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .action(a.getAction())
                .performedBy(a.getPerformedBy())
                .performedByName(a.getPerformedByName())
                .performedAt(a.getPerformedAt())
                .detail(a.getDetail())
                .build();
    }
}
