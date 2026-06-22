package com.tingo.restaurants.application.service;

import com.tingo.restaurants.domain.model.Reservation;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Envía recordatorios automáticos de reservas confirmadas (Sprint 11, S11-01/02/03).
 * Corre cada hora: recordatorio "mañana" (~24h antes) y "en unas horas" (~2h antes).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationReminderScheduler {

    private final ReservationJpaRepository reservationRepository;
    private final EmailService emailService;

    private static final int PAYMENT_DEADLINE_HOURS = 24;

    @Scheduled(cron = "0 0 * * * *") // al inicio de cada hora
    @Transactional
    public void hourlyTasks() {
        sendDayBefore();
        sendHoursBefore();
        autoCancelUnpaid();
    }

    /** Auto-cancela reservas pendientes cuyo adelanto no se pagó a tiempo (S12-06). */
    private void autoCancelUnpaid() {
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusHours(PAYMENT_DEADLINE_HOURS);
        List<ReservationEntity> list = reservationRepository
                .findByStatusAndPaymentStatus(ReservationStatus.PENDING, "PENDING_PAYMENT");
        for (ReservationEntity e : list) {
            if (e.getDeletedAt() != null || e.getCreatedAt() == null) continue;
            if (e.getCreatedAt().isBefore(cutoff)) {
                e.setStatus(ReservationStatus.CANCELLED);
                e.setCancelledAt(java.time.LocalDateTime.now());
                e.setCancellationReason("Cancelada automáticamente: el adelanto no se pagó dentro de "
                        + PAYMENT_DEADLINE_HOURS + " horas");
                reservationRepository.save(e);
                emailService.sendReservationCancelled(toDomain(e));
            }
        }
    }

    /** Recordatorio ~24h antes: reservas confirmadas de mañana. */
    private void sendDayBefore() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<ReservationEntity> list = reservationRepository
                .findByReservationDateAndStatus(tomorrow, ReservationStatus.CONFIRMED);
        for (ReservationEntity e : list) {
            if (e.isReminder24hSent() || e.getDeletedAt() != null) continue;
            emailService.sendReservationReminder(toDomain(e), "mañana");
            e.setReminder24hSent(true);
            reservationRepository.save(e);
        }
    }

    /** Recordatorio ~2h antes: reservas confirmadas de hoy cuya hora llega pronto. */
    private void sendHoursBefore() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime limit = now.plusHours(2);
        List<ReservationEntity> list = reservationRepository
                .findByReservationDateAndStatus(today, ReservationStatus.CONFIRMED);
        for (ReservationEntity e : list) {
            if (e.isReminder2hSent() || e.getDeletedAt() != null || e.getStartTime() == null) continue;
            // Dentro de las próximas ~2h y aún no pasó.
            if (!e.getStartTime().isBefore(now) && !e.getStartTime().isAfter(limit)) {
                emailService.sendReservationReminder(toDomain(e), "en unas horas");
                e.setReminder2hSent(true);
                reservationRepository.save(e);
            }
        }
    }

    /** Solo los campos que necesita el correo. */
    private Reservation toDomain(ReservationEntity e) {
        return Reservation.builder()
                .restaurantId(e.getRestaurantId())
                .customerName(e.getCustomerName())
                .customerEmail(e.getCustomerEmail())
                .confirmationCode(e.getConfirmationCode())
                .reservationDate(e.getReservationDate())
                .startTime(e.getStartTime())
                .partySize(e.getPartySize())
                .advanceAmount(e.getAdvanceAmount())
                .build();
    }
}
