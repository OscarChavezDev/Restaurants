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
    private final com.tingo.restaurants.infrastructure.persistence.repository.RestaurantSectionJpaRepository sectionRepository;
    private final ReservationConfigService reservationConfigService;
    private final com.tingo.restaurants.infrastructure.persistence.repository.DishJpaRepository dishRepository;
    private final com.tingo.restaurants.infrastructure.persistence.repository.ReservationOrderItemJpaRepository orderItemRepository;

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

        // Validación de la sección elegida (S9-04): debe existir, ser de este
        // restaurante, estar activa y tener capacidad para el grupo.
        if (request.getSectionId() != null) {
            var section = sectionRepository.findById(request.getSectionId())
                    .orElseThrow(() -> new ReservationException("La sección seleccionada no existe"));
            if (!request.getRestaurantId().equals(section.getRestaurantId()) || !section.isActive()) {
                throw new ReservationException("La sección seleccionada no es válida para este restaurante");
            }
            if (section.getCapacity() < request.getPartySize()) {
                throw new ReservationException(
                        "La sección '" + section.getName() + "' no tiene capacidad para " + request.getPartySize() + " personas");
            }
        }

        // ── Parametrización de reservas (Sprint 10) ──
        var cfg = reservationConfigService.getOrDefault(request.getRestaurantId());

        // Anticipación mínima (S10): no se puede reservar con menos de N horas.
        java.time.LocalDateTime when = java.time.LocalDateTime.of(request.getReservationDate(), request.getStartTime());
        if (cfg.getMinAdvanceHours() > 0
                && when.isBefore(java.time.LocalDateTime.now().plusHours(cfg.getMinAdvanceHours()))) {
            throw new ReservationException(
                    "Debes reservar con al menos " + cfg.getMinAdvanceHours() + " horas de anticipación");
        }

        // Términos y condiciones (S10-04): si el restaurante los definió, hay que aceptarlos.
        if (cfg.getTermsAndConditions() != null && !cfg.getTermsAndConditions().isBlank()
                && !request.isTermsAccepted()) {
            throw new ReservationException("Debes aceptar los términos y condiciones para reservar");
        }

        // Pre-pedido del menú (S10-07): valida platos y calcula el total del pedido.
        java.util.List<com.tingo.restaurants.infrastructure.persistence.entity.ReservationOrderItemEntity> orderItems = new java.util.ArrayList<>();
        java.math.BigDecimal orderTotal = java.math.BigDecimal.ZERO;
        if (request.getOrderItems() != null && !request.getOrderItems().isEmpty()) {
            for (var item : request.getOrderItems()) {
                var dish = dishRepository.findById(item.getDishId())
                        .filter(d -> d.getDeletedAt() == null)
                        .orElseThrow(() -> new ReservationException("Un plato del pedido no existe"));
                if (!request.getRestaurantId().equals(dish.getRestaurantId()) || !dish.isAvailable()) {
                    throw new ReservationException("Un plato del pedido no está disponible en este restaurante");
                }
                int qty = Math.max(1, item.getQuantity());
                orderItems.add(com.tingo.restaurants.infrastructure.persistence.entity.ReservationOrderItemEntity.builder()
                        .dishId(dish.getId()).dishName(dish.getName()).quantity(qty).unitPrice(dish.getPrice())
                        .build());
                orderTotal = orderTotal.add(dish.getPrice().multiply(java.math.BigDecimal.valueOf(qty)));
            }
        }

        boolean hasOrder = !orderItems.isEmpty();
        // Con pre-pedido: el adelanto es % del pedido (si el local exige adelanto) y la prioridad sube.
        java.math.BigDecimal advanceAmount;
        if (hasOrder && cfg.isRequiresAdvancePayment()) {
            advanceAmount = orderTotal.multiply(java.math.BigDecimal.valueOf(cfg.getLargeGroupAdvancePercent()))
                    .divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        } else {
            advanceAmount = reservationConfigService.computeAdvance(cfg, request.getPartySize(), request.getRestaurantId());
        }
        String priority = (hasOrder || request.getPartySize() > cfg.getSmallGroupMaxPersons()) ? "HIGH" : "NORMAL";
        // Estado de pago inicial (S12-05): si hay adelanto, queda pendiente de pago.
        String paymentStatus = advanceAmount != null && advanceAmount.signum() > 0 ? "PENDING_PAYMENT" : "NOT_REQUIRED";

        String confirmationCode = generateConfirmationCode();

        Reservation reservation = Reservation.builder()
                .id(UUID.randomUUID())
                .restaurantId(request.getRestaurantId())
                .customerId(customerId)
                .sectionId(request.getSectionId())
                .advanceAmount(advanceAmount)
                .termsAccepted(request.isTermsAccepted())
                .priority(priority)
                .paymentStatus(paymentStatus)
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

        if (hasOrder) {
            orderItems.forEach(oi -> oi.setReservationId(saved.getId()));
            orderItemRepository.saveAll(orderItems);
        }

        eventPublisher.publishEvent(new ReservationCreatedEvent(saved));
        emailService.sendReservationCreated(saved);
        log.info("Reserva creada: {} para restaurante: {}", saved.getConfirmationCode(), request.getRestaurantId());
        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse confirm(UUID id, UUID requesterId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        requireRestaurantOwnership(reservation, requesterId, isAdmin);
        Reservation confirmed = reservation.confirm();
        Reservation saved = reservationRepository.save(confirmed);
        emailService.sendReservationConfirmed(saved);
        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse cancel(UUID id, String reason, UUID requesterId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        // Puede cancelar: ADMIN, el dueño del restaurante, o el cliente que la creó.
        boolean isOwner = isRestaurantOwner(reservation, requesterId);
        boolean isCustomer = requesterId != null && requesterId.equals(reservation.getCustomerId());
        if (!isAdmin && !isOwner && !isCustomer) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No tienes permiso para cancelar esta reserva");
        }

        // Límite de cancelación (S10-05): solo aplica al cliente; dueño/ADMIN pueden siempre.
        if (isCustomer && !isOwner && !isAdmin) {
            var cfg = reservationConfigService.getOrDefault(reservation.getRestaurantId());
            if (cfg.getCancellationDeadlineHours() > 0) {
                java.time.LocalDateTime when = java.time.LocalDateTime.of(
                        reservation.getReservationDate(), reservation.getStartTime());
                if (java.time.LocalDateTime.now().isAfter(when.minusHours(cfg.getCancellationDeadlineHours()))) {
                    throw new ReservationException(
                            "Ya no puedes cancelar online: el límite es " + cfg.getCancellationDeadlineHours()
                                    + " horas antes. Comunícate con el restaurante.");
                }
            }
        }

        Reservation cancelled = reservation.cancel(reason);
        Reservation saved = reservationRepository.save(cancelled);
        eventPublisher.publishEvent(new ReservationCancelledEvent(saved));
        emailService.sendReservationCancelled(saved);
        return mapToResponse(saved);
    }

    @Transactional
    public ReservationResponse completeReservation(UUID id, UUID requesterId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        requireRestaurantOwnership(reservation, requesterId, isAdmin);
        Reservation completed = reservation.complete();
        log.info("Reserva {} marcada como COMPLETED", completed.getConfirmationCode());
        return mapToResponse(reservationRepository.save(completed));
    }

    @Transactional
    public ReservationResponse markNoShow(UUID id, UUID requesterId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        requireRestaurantOwnership(reservation, requesterId, isAdmin);
        Reservation noShow = reservation.markNoShow();
        log.info("Reserva {} marcada como NO_SHOW", noShow.getConfirmationCode());
        return mapToResponse(reservationRepository.save(noShow));
    }

    // ── Autorización: el restaurante de la reserva debe pertenecer al solicitante ──
    private boolean isRestaurantOwner(Reservation reservation, UUID requesterId) {
        if (requesterId == null || reservation.getRestaurantId() == null) return false;
        return restaurantRepository.findById(reservation.getRestaurantId())
                .map(r -> requesterId.equals(r.getOwnerId()))
                .orElse(false);
    }

    private void requireRestaurantOwnership(Reservation reservation, UUID requesterId, boolean isAdmin) {
        if (!isAdmin && !isRestaurantOwner(reservation, requesterId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No tienes permiso sobre las reservas de este restaurante");
        }
    }

    /** Actualiza alergias/preferencias (specialRequests) — usado por el asistente (S12-04). */
    @Transactional
    public ReservationResponse updateSpecialRequests(UUID id, String text, UUID requesterId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationException("Reserva no encontrada"));
        boolean isCustomer = requesterId != null && requesterId.equals(reservation.getCustomerId());
        if (!isAdmin && !isCustomer && !isRestaurantOwner(reservation, requesterId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No puedes modificar esta reserva");
        }
        Reservation updated = reservation.toBuilder()
                .specialRequests(text)
                .updatedAt(LocalDateTime.now())
                .build();
        return mapToResponse(reservationRepository.save(updated));
    }

    public ReservationResponse findByConfirmationCode(String code) {
        return reservationRepository.findByConfirmationCode(code)
                .map(this::mapToResponse)
                .orElseThrow(() -> ReservationException.notFound(code));
    }

    /** IDs de restaurantes ACTIVOS, abiertos ahora y con al menos un cupo libre en este momento (S6-05). */
    public List<UUID> availableNowRestaurantIds() {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalTime now = java.time.LocalTime.now();
        return restaurantRepository
                .findByStatus(com.tingo.restaurants.domain.model.enums.RestaurantStatus.ACTIVE,
                        org.springframework.data.domain.PageRequest.of(0, 500))
                .getContent().stream()
                .filter(r -> r.isOpenAt(today.getDayOfWeek(), now))
                .filter(r -> r.getTotalCapacity() - reservationRepository.sumOccupiedSeats(r.getId(), today, now) > 0)
                .map(Restaurant::getId)
                .collect(Collectors.toList());
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

    public PagedResponse<ReservationResponse> findByRestaurant(UUID restaurantId, Pageable pageable,
                                                               UUID requesterId, boolean isAdmin) {
        // Un OWNER solo puede ver las reservas de SUS restaurantes (evita exponer
        // datos personales de clientes de otros locales). ADMIN ve cualquiera.
        if (!isAdmin) {
            Restaurant restaurant = restaurantRepository.findById(restaurantId)
                    .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
            if (!requesterId.equals(restaurant.getOwnerId())) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "No tienes permiso para ver las reservas de este restaurante");
            }
        }
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
        // Pre-pedido (S10-07)
        if (reservation.getId() != null) {
            var items = orderItemRepository.findByReservationId(reservation.getId());
            if (!items.isEmpty()) {
                response.setOrderItems(items.stream()
                        .map(i -> com.tingo.restaurants.application.dto.response.ReservationOrderItemResponse.builder()
                                .dishId(i.getDishId()).dishName(i.getDishName())
                                .quantity(i.getQuantity()).unitPrice(i.getUnitPrice()).build())
                        .toList());
                response.setOrderTotal(items.stream()
                        .map(i -> i.getUnitPrice().multiply(java.math.BigDecimal.valueOf(i.getQuantity())))
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
            }
        }
        return response;
    }
}
