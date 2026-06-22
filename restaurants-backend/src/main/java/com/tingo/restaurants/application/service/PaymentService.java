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

        ReservationEntity reservation = reservationRepository.findById(payment.getReservationId()).orElse(null);
        if (reservation != null) {
            reservation.setPaymentStatus("PAYMENT_VERIFIED");
            reservationRepository.save(reservation);
        }
        return toResponse(payment, reservation);
    }

    @Transactional
    public PaymentResponse reject(UUID paymentId, UUID verifierId) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
        ownershipGuard.assertOwnsRestaurant(payment.getRestaurantId());

        payment.setStatus("REJECTED");
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerifiedBy(verifierId);
        paymentRepository.save(payment);

        // El comprobante no es válido / no llegó el pago: la reserva vuelve a
        // quedar pendiente de pago para que el cliente pueda reintentar.
        ReservationEntity reservation = reservationRepository.findById(payment.getReservationId()).orElse(null);
        if (reservation != null) {
            reservation.setPaymentStatus("PENDING_PAYMENT");
            reservationRepository.save(reservation);
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
