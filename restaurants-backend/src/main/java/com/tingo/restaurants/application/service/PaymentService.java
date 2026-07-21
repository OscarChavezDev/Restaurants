package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.PaymentProofRequest;
import com.tingo.restaurants.application.dto.response.PaymentResponse;
import com.tingo.restaurants.infrastructure.persistence.entity.PaymentEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.PaymentJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Pago del adelanto de reservas (Sprint 12). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentJpaRepository paymentRepository;
    private final ReservationJpaRepository reservationRepository;
    private final OwnershipGuard ownershipGuard;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Transactional
    public PaymentResponse submitProof(PaymentProofRequest req, UUID customerId, boolean isAdmin) {
        ReservationEntity reservation = reservationRepository.findById(req.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        // Solo el cliente dueño de la reserva (o ADMIN) puede subir el comprobante.
        if (!isAdmin && reservation.getCustomerId() != null && !reservation.getCustomerId().equals(customerId)) {
            throw new AccessDeniedException("No puedes subir un comprobante para esta reserva");
        }

        PaymentEntity payment = PaymentEntity.builder()
                .reservationId(reservation.getId())
                .restaurantId(reservation.getRestaurantId())
                .amount(req.getAmount())
                .method(req.getMethod())
                .status("SUBMITTED")
                .proofImageUrl(req.getProofImageUrl())
                .build();
        PaymentEntity saved = paymentRepository.save(payment);

        reservation.setPaymentStatus("PROOF_SUBMITTED");
        reservationRepository.save(reservation);

        return toResponse(saved, reservation);
    }

    @Transactional
    public PaymentResponse verify(UUID paymentId, UUID verifierId) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
        ownershipGuard.assertOwnsRestaurant(payment.getRestaurantId());

        payment.setStatus("VERIFIED");
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerifiedBy(verifierId);
        paymentRepository.save(payment);
        auditLogService.record("PAYMENT", payment.getId(), "VERIFY_PAYMENT", verifierId,
                "Monto: S/ " + payment.getAmount() + " · Método: " + payment.getMethod());

        ReservationEntity reservation = reservationRepository.findById(payment.getReservationId()).orElse(null);
        if (reservation != null) {
            reservation.setPaymentStatus("PAYMENT_VERIFIED");

            // Verificar el pago también confirma la reserva si seguía pendiente — antes eran
            // dos pasos manuales separados y era fácil verificar el pago sin confirmar la
            // reserva, por lo que el cliente nunca recibía el correo de confirmación con el QR.
            boolean justConfirmed = reservation.getStatus() == com.tingo.restaurants.domain.model.enums.ReservationStatus.PENDING;
            if (justConfirmed) {
                reservation.setStatus(com.tingo.restaurants.domain.model.enums.ReservationStatus.CONFIRMED);
                reservation.setConfirmedAt(LocalDateTime.now());
            }
            reservationRepository.save(reservation);

            // Notificar al cliente por email que su comprobante fue verificado
            com.tingo.restaurants.domain.model.Reservation domainRes =
                    com.tingo.restaurants.domain.model.Reservation.builder()
                            .id(reservation.getId())
                            .restaurantId(reservation.getRestaurantId())
                            .customerName(reservation.getCustomerName())
                            .customerEmail(reservation.getCustomerEmail())
                            .confirmationCode(reservation.getConfirmationCode())
                            .reservationDate(reservation.getReservationDate())
                            .startTime(reservation.getStartTime())
                            .partySize(reservation.getPartySize())
                            .advanceAmount(reservation.getAdvanceAmount())
                            .build();
            emailService.sendPaymentVerified(domainRes, payment.getAmount(), payment.getMethod());
            if (justConfirmed) {
                emailService.sendReservationConfirmed(domainRes);
            }
        }
        return toResponse(payment, reservation);
    }

    @Transactional
    public PaymentResponse reject(UUID paymentId, UUID verifierId, String reason) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
        ownershipGuard.assertOwnsRestaurant(payment.getRestaurantId());

        payment.setStatus("REJECTED");
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerifiedBy(verifierId);
        paymentRepository.save(payment);
        auditLogService.record("PAYMENT", payment.getId(), "REJECT_PAYMENT", verifierId,
                "Monto: S/ " + payment.getAmount() + " · Método: " + payment.getMethod() + " · Motivo: " + reason);

        // El comprobante no es válido / no llegó el pago: la reserva vuelve a
        // quedar pendiente de pago para que el cliente pueda reintentar.
        ReservationEntity reservation = reservationRepository.findById(payment.getReservationId()).orElse(null);
        if (reservation != null) {
            reservation.setPaymentStatus("PENDING_PAYMENT");
            reservationRepository.save(reservation);

            // Notificar al cliente por email que su comprobante fue rechazado.
            com.tingo.restaurants.domain.model.Reservation domainRes =
                    com.tingo.restaurants.domain.model.Reservation.builder()
                            .id(reservation.getId())
                            .restaurantId(reservation.getRestaurantId())
                            .customerName(reservation.getCustomerName())
                            .customerEmail(reservation.getCustomerEmail())
                            .confirmationCode(reservation.getConfirmationCode())
                            .reservationDate(reservation.getReservationDate())
                            .startTime(reservation.getStartTime())
                            .partySize(reservation.getPartySize())
                            .advanceAmount(reservation.getAdvanceAmount())
                            .build();
            emailService.sendPaymentRejected(domainRes, payment.getAmount(), payment.getMethod(), reason);
        }
        return toResponse(payment, reservation);
    }

    public List<PaymentResponse> listByRestaurant(UUID restaurantId) {
        ownershipGuard.assertOwnsRestaurant(restaurantId);
        return paymentRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
                .map(p -> toResponse(p, reservationRepository.findById(p.getReservationId()).orElse(null)))
                .toList();
    }

    private PaymentResponse toResponse(PaymentEntity p, ReservationEntity r) {
        return PaymentResponse.builder()
                .id(p.getId())
                .reservationId(p.getReservationId())
                .confirmationCode(r != null ? r.getConfirmationCode() : null)
                .customerName(r != null ? r.getCustomerName() : null)
                .reservationDate(r != null ? r.getReservationDate() : null)
                .amount(p.getAmount())
                .method(p.getMethod())
                .status(p.getStatus())
                .proofImageUrl(p.getProofImageUrl())
                .createdAt(p.getCreatedAt())
                .verifiedAt(p.getVerifiedAt())
                .build();
    }
}
