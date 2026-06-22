package com.tingo.restaurants.infrastructure.persistence.adapter;

import com.tingo.restaurants.domain.model.Reservation;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import com.tingo.restaurants.domain.repository.ReservationRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ReservationRepositoryAdapter implements ReservationRepository {

    private final ReservationJpaRepository jpaRepository;

    @Override
    public Reservation save(Reservation reservation) {
        return toDomain(jpaRepository.save(toEntity(reservation)));
    }

    @Override
    public Optional<Reservation> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Reservation> findByConfirmationCode(String code) {
        return jpaRepository.findByConfirmationCode(code).map(this::toDomain);
    }

    @Override
    public Page<Reservation> findByRestaurantId(UUID restaurantId, Pageable pageable) {
        return jpaRepository.findByRestaurantId(restaurantId, pageable).map(this::toDomain);
    }

    @Override
    public Page<Reservation> findByRestaurantIdAndDate(UUID restaurantId, LocalDate date, Pageable pageable) {
        return jpaRepository.findByRestaurantIdAndReservationDate(restaurantId, date, pageable).map(this::toDomain);
    }

    @Override
    public Page<Reservation> findByCustomerId(UUID customerId, Pageable pageable) {
        return jpaRepository.findByCustomerId(customerId, pageable).map(this::toDomain);
    }

    @Override
    public List<Reservation> findByRestaurantIdAndDateAndStatus(UUID restaurantId, LocalDate date, ReservationStatus status) {
        return jpaRepository.findByRestaurantIdAndReservationDateAndStatus(restaurantId, date, status)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public int countByRestaurantIdAndDateAndStatus(UUID restaurantId, LocalDate date, ReservationStatus status) {
        return (int) jpaRepository.countByRestaurantIdAndReservationDateAndStatus(restaurantId, date, status);
    }

    @Override
    public int sumPartySizeByRestaurantAndDate(UUID restaurantId, LocalDate date) {
        return jpaRepository.sumPartySizeByRestaurantAndDate(restaurantId, date);
    }

    @Override
    public boolean existsByConfirmationCode(String code) {
        return jpaRepository.existsByConfirmationCode(code);
    }

    @Override
    public int sumOccupiedSeats(UUID restaurantId, LocalDate date, java.time.LocalTime time) {
        return jpaRepository.sumOccupiedSeats(restaurantId, date, time);
    }

    private Reservation toDomain(ReservationEntity e) {
        return Reservation.builder()
                .id(e.getId()).restaurantId(e.getRestaurantId()).customerId(e.getCustomerId())
                .tableId(e.getTableId()).sectionId(e.getSectionId()).customerName(e.getCustomerName())
                .customerEmail(e.getCustomerEmail()).customerPhone(e.getCustomerPhone())
                .reservationDate(e.getReservationDate()).startTime(e.getStartTime())
                .endTime(e.getEndTime()).partySize(e.getPartySize())
                .advanceAmount(e.getAdvanceAmount()).termsAccepted(e.isTermsAccepted()).priority(e.getPriority())
                .paymentStatus(e.getPaymentStatus())
                .status(e.getStatus())
                .notes(e.getNotes()).specialRequests(e.getSpecialRequests())
                .confirmationCode(e.getConfirmationCode()).relatedEventId(e.getRelatedEventId())
                .relatedEventName(e.getRelatedEventName()).isEventRelated(e.isEventRelated())
                .confirmedAt(e.getConfirmedAt()).cancelledAt(e.getCancelledAt())
                .cancellationReason(e.getCancellationReason())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                .build();
    }

    private ReservationEntity toEntity(Reservation r) {
        ReservationEntity e = new ReservationEntity();
        e.setId(r.getId()); e.setRestaurantId(r.getRestaurantId());
        e.setCustomerId(r.getCustomerId()); e.setTableId(r.getTableId()); e.setSectionId(r.getSectionId());
        e.setCustomerName(r.getCustomerName()); e.setCustomerEmail(r.getCustomerEmail());
        e.setCustomerPhone(r.getCustomerPhone()); e.setReservationDate(r.getReservationDate());
        e.setStartTime(r.getStartTime()); e.setEndTime(r.getEndTime());
        e.setPartySize(r.getPartySize()); e.setStatus(r.getStatus());
        e.setAdvanceAmount(r.getAdvanceAmount()); e.setTermsAccepted(r.isTermsAccepted());
        if (r.getPriority() != null) e.setPriority(r.getPriority());
        if (r.getPaymentStatus() != null) e.setPaymentStatus(r.getPaymentStatus());
        e.setNotes(r.getNotes()); e.setSpecialRequests(r.getSpecialRequests());
        e.setConfirmationCode(r.getConfirmationCode()); e.setRelatedEventId(r.getRelatedEventId());
        e.setRelatedEventName(r.getRelatedEventName()); e.setEventRelated(r.isEventRelated());
        e.setConfirmedAt(r.getConfirmedAt()); e.setCancelledAt(r.getCancelledAt());
        e.setCancellationReason(r.getCancellationReason());
        return e;
    }
}
