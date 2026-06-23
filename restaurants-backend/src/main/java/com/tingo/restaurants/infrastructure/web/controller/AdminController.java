package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.AuditLogResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.SystemStatsResponse;
import com.tingo.restaurants.application.service.AuditLogService;
import com.tingo.restaurants.application.service.SystemStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin · Sistema", description = "Métricas globales y auditoría (solo ADMIN)")
public class AdminController {

    private final SystemStatsService systemStatsService;
    private final AuditLogService auditLogService;

    @GetMapping("/system-stats")
    @Operation(summary = "Métricas agregadas de todo el sistema (S15-01)")
    public ResponseEntity<ApiResponse<SystemStatsResponse>> systemStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(systemStatsService.getSystemStats(from, to)));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Listar logs de auditoría con filtros (S15-03)")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> auditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.plusDays(1).atStartOfDay() : null;
        // La query ya ordena por performedAt DESC; no se pasa Sort en el Pageable para no duplicar el ORDER BY.
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogService.search(entityType, action, fromDateTime, toDateTime, pageable)));
    }
}
