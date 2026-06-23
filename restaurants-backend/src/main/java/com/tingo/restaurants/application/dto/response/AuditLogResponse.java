package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Entrada de auditoría (S15-03). */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogResponse {
    private UUID id;
    private String entityType;
    private UUID entityId;
    private String action;
    private UUID performedBy;
    private String performedByName;
    private LocalDateTime performedAt;
    private String detail;
}
