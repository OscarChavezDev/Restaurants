package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.CreateReservationRequest;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.ReservationResponse;
import com.tingo.restaurants.application.mapper.ReservationMapper;
import com.tingo.restaurants.domain.event.ReservationCancelledEvent;
import com.tingo.restaurants.domain.event.ReservationCreatedEvent;
import com.tingo.restaurants.domain.exception.ReservationException;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.Reservation;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.model.enums.ReservationStatus;
import com.tingo.restaurants.domain.repository.ReservationRepository;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationService {

    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ReservationRepository reservationRepository;
    private final RestaurantRepository restaurantRepository;
    private final ReservationMapper reservationMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final EmailService emailService;

    @Transactional
    public ReservationResponse create(CreateReservationRequest request, UUID customerId) {
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new RestaurantNotFoundException(request.getRestaurantId()));

        if (!restaurant.isActive()) {
            throw ReservationException.restaurantClosed();
        }

        if (!restaurant.canAcceptReservation(request.getPartySize())) {
            throw ReservationException.capacityExceeded(request.getPartySize(), restaurant.getTotalCapacity());
        }

        // Verificar disponibilidad del día
        if (!restaurant.isOpenAt(request.getReservationDate().getDayOfWeek(), request.getStartTime())) {
            throw ReservationException.restaurantClosed();
        }

        int occupiedSeats = reservationRepository.sumPartySizeByRestaurantAndDate(
                request.getRestaurantId(), request.getReservationDate());

        if (occupiedSeats + request.getPartySize() > restaurant.getTotalCapacity()) {
            throw ReservationException.capacityExceeded(
                    request.getPartySize(),
                    restaurant.getTotalCapacity() - occupiedSeats
            );
        }

        String confirmationCode = generateConfirmationCode();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .restaurantId(request.getRestaurantId())
                .customerId(customerId)
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail())
                .customerPhone(request.getCustomerPhone())
                .reservationDate(request.getReservationDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .partySize(request.getPartySize())
                .status(ReservationStatus.PENDING)
                .notes(request.getNotes())
                .specialRequests(request.getSpecialRequests())
                .confirmationCode(confirmationCode)
                .relatedEventId(request.getRelatedEventId())
                .relatedEventName(request.getRelatedEventName())
                .isEventRelated(request.getRelatedEventId() != null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Reservation saved = reservationRepository.save(reservation);
        eventPublisher.publishEvent(new ReservationCreatedEvent(saved));
        emailService.sendReservationCreated(saved);
        log.info("Reserva creada: {} para restaurante: {}", saved.getConfirmationCode(), request.getRestaurantId());
        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse confirm(UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        Reservation confirmed = reservation.confirm();
        Reservation saved = reservationRepository.save(confirmed);
        emailService.sendReservationConfirmed(saved);
        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse cancel(UUID id, String reason) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        Reservation cancelled = reservation.cancel(reason);
        Reservation saved = reservationRepository.save(cancelled);
        eventPublisher.publishEvent(new ReservationCancelledEvent(saved));
        emailService.sendReservationCancelled(saved);
        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse completeReservation(UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        Reservation completed = reservation.complete();
        log.info("Reserva {} marcada como COMPLETED", completed.getConfirmationCode());
        return mapToResponse(reservationRepository.save(completed));
    }

    @Transactional
    public ReservationResponse markNoShow(UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        Reservation noShow = reservation.markNoShow();
        log.info("Reserva {} marcada como NO_SHOW", noShow.getConfirmationCode());
        return mapToResponse(reservationRepository.save(noShow));
    }

    public ReservationResponse findByConfirmationCode(String code) {
        return reservationRepository.findByConfirmationCode(code)
                .map(this::mapToResponse)
                .orElseThrow(() -> ReservationException.notFound(code));
    }

    public com.tingo.restaurants.application.dto.response.AvailabilityResponse checkAvailability(UUID restaurantId, java.time.LocalDate date, java.time.LocalTime time, int partySize) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        
        int occupiedSeats = reservationRepository.sumOccupiedSeats(restaurantId, date, time);
        int totalCapacity = restaurant.getTotalCapacity();
        int remainingSeats = totalCapacity - occupiedSeats;
        
        boolean isAvailable = restaurant.isActive() && 
                              restaurant.isOpenAt(date.getDayOfWeek(), time) &&
                              remainingSeats >= partySize;
                              
        return com.tingo.restaurants.application.dto.response.AvailabilityResponse.builder()
                .available(isAvailable)
                .requestedPartySize(partySize)
                .occupiedSeats(occupiedSeats)
                .totalCapacity(totalCapacity)
                .remainingSeats(Math.max(0, remainingSeats))
                .build();
    }

    public PagedResponse<ReservationResponse> findByRestaurant(UUID restaurantId, Pageable pageable) {
        Page<ReservationResponse> page = reservationRepository
                .findByRestaurantId(restaurantId, pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(page);
    }

    public PagedResponse<ReservationResponse> findByCustomer(UUID customerId, Pageable pageable) {
        Page<ReservationResponse> page = reservationRepository
                .findByCustomerId(customerId, pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(page);
    }

    private String generateConfirmationCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("RES-");
            for (int i = 0; i < 8; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (reservationRepository.existsByConfirmationCode(code));
        return code;
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        ReservationResponse response = reservationMapper.toResponse(reservation);
        if (reservation.getRestaurantId() != null) {
            restaurantRepository.findById(reservation.getRestaurantId())
                    .ifPresent(r -> response.setRestaurantName(r.getName()));
        }
        return response;
    }
}
