package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.CreateRestaurantRequest;
import com.tingo.restaurants.application.dto.response.DailyMenuItemResponse;
import com.tingo.restaurants.application.dto.response.DailyStatusResponse;
import com.tingo.restaurants.application.dto.response.NearbyEventResponse;
import com.tingo.restaurants.application.dto.response.NearbyLodgingResponse;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.application.dto.response.ScheduleResponse;
import com.tingo.restaurants.application.mapper.RestaurantMapper;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.FoodCategory;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.model.Schedule;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import com.tingo.restaurants.infrastructure.integration.ActifyEventsClient;
import com.tingo.restaurants.infrastructure.integration.HospyLodgingClient;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantTableEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.DishJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantTableJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;
    private final AuditLogService auditLogService;
    private final ActifyEventsClient actifyEventsClient;
    private final HospyLodgingClient hospyLodgingClient;
    private final RestaurantTableJpaRepository restaurantTableJpaRepository;
    private final DishJpaRepository dishJpaRepository;

    @Transactional
    public RestaurantResponse create(CreateRestaurantRequest request, UUID ownerId) {
        log.info("Creando restaurante: {} para owner: {}", request.getName(), ownerId);

        String slug = generateUniqueSlug(request.getName());

        Restaurant restaurant = Restaurant.builder()
                .id(UUID.randomUUID())
                .ownerId(ownerId)
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .ruc(request.getRuc())
                .status(RestaurantStatus.PENDING_APPROVAL)
                .address(request.getAddress())
                .district(request.getDistrict())
                .city(request.getCity())
                .region(request.getRegion())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .totalCapacity(request.getTotalCapacity())
                .priceLevel(request.getPriceLevel() != null ? request.getPriceLevel() : 2)
                .minReservationSize(request.getMinReservationSize())
                .maxReservationSize(request.getMaxReservationSize())
                .coverImageUrl(request.getCoverImageUrl())
                .logoUrl(request.getLogoUrl())
                .acceptsReservations(request.isAcceptsReservations())
                .acceptsEvents(request.isAcceptsEvents())
                .hasParking(request.isHasParking())
                .hasWifi(request.isHasWifi())
                .hasAirConditioning(request.isHasAirConditioning())
                .isAccessible(request.isAccessible())
                .categories(toCategories(request.getCategoryIds()))
                .avgRating(BigDecimal.ZERO)
                .totalRatings(0)
                .build();

        Restaurant saved = restaurantRepository.save(restaurant);
        log.info("Restaurante creado con ID: {}", saved.getId());
        return restaurantMapper.toResponse(saved);
    }

    public RestaurantResponse findById(UUID id) {
        return restaurantRepository.findById(id)
                .map(restaurantMapper::toResponse)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
    }

    public RestaurantResponse findBySlug(String slug) {
        return restaurantRepository.findBySlug(slug)
                .map(restaurantMapper::toResponse)
                .orElseThrow(() -> new RestaurantNotFoundException(slug));
    }

    public PagedResponse<RestaurantResponse> findAll(Pageable pageable) {
        Page<RestaurantResponse> page = restaurantRepository
                .findByStatus(RestaurantStatus.ACTIVE, pageable)
                .map(restaurantMapper::toResponse);
        return PagedResponse.from(page);
    }

    // Solo para ADMIN: ver todos los restaurantes sin filtrar por estado
    public PagedResponse<RestaurantResponse> findAllForAdmin(RestaurantStatus status, Pageable pageable) {
        Page<RestaurantResponse> page;
        if (status != null) {
            page = restaurantRepository.findByStatus(status, pageable).map(restaurantMapper::toResponse);
        } else {
            page = restaurantRepository.findAll(pageable).map(restaurantMapper::toResponse);
        }
        return PagedResponse.from(page);
    }

    public PagedResponse<RestaurantResponse> search(String name, String city,
                                                     String categoryId, String priceRange, Pageable pageable) {
        Page<RestaurantResponse> page = restaurantRepository
                .findByFilters(name, city, categoryId, priceRange, RestaurantStatus.ACTIVE, pageable)
                .map(restaurantMapper::toResponse);
        return PagedResponse.from(page);
    }

    public List<RestaurantResponse> findNearby(BigDecimal lat, BigDecimal lon, double radiusKm) {
        log.debug("Buscando restaurantes cercanos a lat:{} lon:{} radio:{}km", lat, lon, radiusKm);
        return restaurantRepository.findNearby(lat, lon, radiusKm)
                .stream()
                .map(restaurantMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Eventos cercanos a un restaurante (Sistema de Eventos: Actify), para
     * mostrarle al usuario qué está pasando cerca de donde va a comer — el
     * inverso de {@link #findNearbyEvent}. Lista vacía si Actify no está
     * configurado o no hay resultados.
     */
    public List<NearbyEventResponse> getNearbyEvents(UUID restaurantId, double radiusKm) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        if (restaurant.getLatitude() == null || restaurant.getLongitude() == null) return List.of();

        return actifyEventsClient.listNearby(restaurant.getLatitude(), restaurant.getLongitude(), radiusKm)
                .stream()
                .map(e -> NearbyEventResponse.builder()
                        .id(e.id()).name(e.name()).startDate(e.startDate()).endDate(e.endDate())
                        .city(e.city()).category(e.category())
                        .availableSpots(e.availableSpots()).soldOut(e.soldOut())
                        .build())
                .toList();
    }

    /**
     * Hospedajes cercanos a un restaurante (Sistema de Hospedaje: Hospy), para
     * mostrarle al usuario dónde alojarse cerca de donde va a comer. Si Hospy no
     * está configurado o no hay resultados, devuelve lista vacía.
     */
    public List<NearbyLodgingResponse> getNearbyLodging(UUID restaurantId, double radiusKm) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
        if (restaurant.getLatitude() == null || restaurant.getLongitude() == null) return List.of();

        return hospyLodgingClient.findNearby(restaurant.getLatitude(), restaurant.getLongitude(), radiusKm)
                .stream()
                .map(l -> NearbyLodgingResponse.builder()
                        .id(l.id()).name(l.name()).type(l.type()).city(l.city())
                        .priceFrom(l.priceFrom()).photoUrl(l.photoUrl()).distanceKm(l.distanceKm())
                        .build())
                .toList();
    }

    /**
     * Estado operativo "de hoy" de un restaurante: horario, si está abierto
     * ahora mismo, mesas/cupos libres y el menú con disponibilidad por plato.
     * Pensado para sistemas de itinerarios turísticos (ver si conviene programar
     * el restaurante como parada de almuerzo/cena en este momento).
     */
    public DailyStatusResponse getDailyStatus(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));

        String status;
        LocalTime openingTime = null;
        LocalTime closingTime = null;

        if (restaurant.getStatus() == RestaurantStatus.TEMPORARILY_CLOSED) {
            status = "CERRADO_TEMPORALMENTE";
        } else if (restaurant.getStatus() != RestaurantStatus.ACTIVE) {
            status = "CERRADO";
        } else {
            DayOfWeek today = LocalDate.now().getDayOfWeek();
            Schedule todaySchedule = restaurant.getSchedules() == null ? null :
                    restaurant.getSchedules().stream()
                            .filter(s -> s.getDayOfWeek() == today)
                            .findFirst().orElse(null);
            boolean openNow = todaySchedule != null && todaySchedule.isOpenAt(LocalTime.now());
            status = openNow ? "ABIERTO" : "CERRADO";
            if (todaySchedule != null) {
                openingTime = todaySchedule.getOpeningTime();
                closingTime = todaySchedule.getClosingTime();
            }
        }

        List<RestaurantTableEntity> tables = restaurantTableJpaRepository.findByRestaurantIdOrderByTableNumber(id);
        int availableTables = 0;
        int availableSeats = 0;
        for (RestaurantTableEntity t : tables) {
            if (t.isActive() && "AVAILABLE".equals(t.getCurrentStatus())) {
                availableTables++;
                availableSeats += t.getCapacity();
            }
        }

        List<DailyMenuItemResponse> menu = dishJpaRepository.findByRestaurantIdAndDeletedAtIsNull(id)
                .stream()
                .map(d -> DailyMenuItemResponse.builder()
                        .id(d.getId()).name(d.getName()).price(d.getPrice()).available(d.isAvailable())
                        .build())
                .toList();

        return DailyStatusResponse.builder()
                .restaurantId(restaurant.getId())
                .name(restaurant.getName())
                .openingTime(openingTime)
                .closingTime(closingTime)
                .status(status)
                .availableTables(availableTables)
                .availableSeats(availableSeats)
                .menu(menu)
                .build();
    }

    /**
     * Restaurantes cercanos a un evento del Sistema de Eventos (Actify): resuelve
     * la ubicación del evento vía {@link ActifyEventsClient} y delega en la misma
     * búsqueda geoespacial PostGIS que usa {@link #findNearby}. Si Actify no está
     * configurado o el evento no existe, devuelve lista vacía (no falla la request).
     */
    public List<RestaurantResponse> findNearbyEvent(String eventId, double radiusKm) {
        ActifyEventsClient.EventLocation event = actifyEventsClient.getEventLocation(eventId);
        if (event == null) {
            log.debug("Evento {} no encontrado en Actify o integración no configurada", eventId);
            return List.of();
        }
        log.debug("Evento {} ({}) ubicado en lat:{} lon:{} — buscando restaurantes en {}km",
                eventId, event.name(), event.latitude(), event.longitude(), radiusKm);
        return restaurantRepository.findNearby(event.latitude(), event.longitude(), radiusKm)
                .stream()
                .map(restaurantMapper::toResponse)
                .collect(Collectors.toList());
    }

    public PagedResponse<RestaurantResponse> findByOwner(UUID ownerId, Pageable pageable) {
        Page<RestaurantResponse> page = restaurantRepository
                .findByOwnerId(ownerId, pageable)
                .map(restaurantMapper::toResponse);
        return PagedResponse.from(page);
    }

    @Transactional
    public RestaurantResponse update(UUID id, CreateRestaurantRequest request, UUID requesterId, boolean isAdmin) {
        Restaurant existing = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));

        // Solo el dueño del restaurante (o un ADMIN) puede editarlo
        if (!isAdmin && !existing.getOwnerId().equals(requesterId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No puedes editar un restaurante que no te pertenece");
        }

        log.info("Actualizando restaurante: {} ({})", existing.getName(), id);

        // Se preservan los campos no editables desde este formulario:
        // id, ownerId, slug, status, calificaciones y auditoría.
        Restaurant updated = Restaurant.builder()
                .id(existing.getId())
                .ownerId(existing.getOwnerId())
                .slug(existing.getSlug())
                .status(existing.getStatus())
                .avgRating(existing.getAvgRating())
                .totalRatings(existing.getTotalRatings())
                .createdAt(existing.getCreatedAt())
                .name(request.getName())
                .description(request.getDescription())
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .ruc(existing.getRuc())   // el RUC no se edita desde el panel; se preserva
                .address(request.getAddress())
                .district(request.getDistrict())
                .city(request.getCity())
                .region(request.getRegion())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .totalCapacity(request.getTotalCapacity())
                .priceLevel(request.getPriceLevel() != null ? request.getPriceLevel() : existing.getPriceLevel())
                .avgDishPrice(existing.getAvgDishPrice())
                .minReservationSize(request.getMinReservationSize())
                .maxReservationSize(request.getMaxReservationSize())
                .coverImageUrl(request.getCoverImageUrl())
                .logoUrl(request.getLogoUrl())
                .acceptsReservations(request.isAcceptsReservations())
                .acceptsEvents(request.isAcceptsEvents())
                .hasParking(request.isHasParking())
                .hasWifi(request.isHasWifi())
                .hasAirConditioning(request.isHasAirConditioning())
                .isAccessible(request.isAccessible())
                .categories(toCategories(request.getCategoryIds()))
                .build();

        return restaurantMapper.toResponse(restaurantRepository.save(updated));
    }

    /** Convierte una lista de ids de categoría en modelos de dominio (solo el id; el adapter resuelve la entidad). */
    private List<FoodCategory> toCategories(List<UUID> categoryIds) {
        if (categoryIds == null) return List.of();
        return categoryIds.stream()
                .filter(java.util.Objects::nonNull)
                .map(id -> FoodCategory.builder().id(id).build())
                .collect(Collectors.toList());
    }

    @Transactional
    public RestaurantResponse updateStatus(UUID id, RestaurantStatus newStatus, UUID requesterId) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
        RestaurantStatus previousStatus = restaurant.getStatus();

        Restaurant updated = Restaurant.builder()
                .id(restaurant.getId())
                .ownerId(restaurant.getOwnerId())
                .name(restaurant.getName())
                .slug(restaurant.getSlug())
                .description(restaurant.getDescription())
                .phone(restaurant.getPhone())
                .email(restaurant.getEmail())
                .website(restaurant.getWebsite())
                .ruc(restaurant.getRuc())
                .status(newStatus)
                .address(restaurant.getAddress())
                .district(restaurant.getDistrict())
                .city(restaurant.getCity())
                .region(restaurant.getRegion())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .totalCapacity(restaurant.getTotalCapacity())
                .priceLevel(restaurant.getPriceLevel())
                .avgDishPrice(restaurant.getAvgDishPrice())
                .minReservationSize(restaurant.getMinReservationSize())
                .maxReservationSize(restaurant.getMaxReservationSize())
                .coverImageUrl(restaurant.getCoverImageUrl())
                .logoUrl(restaurant.getLogoUrl())
                .acceptsReservations(restaurant.isAcceptsReservations())
                .acceptsEvents(restaurant.isAcceptsEvents())
                .hasParking(restaurant.isHasParking())
                .hasWifi(restaurant.isHasWifi())
                .hasAirConditioning(restaurant.isHasAirConditioning())
                .isAccessible(restaurant.isAccessible())
                .categories(restaurant.getCategories())
                .avgRating(restaurant.getAvgRating())
                .totalRatings(restaurant.getTotalRatings())
                .build();

        Restaurant saved = restaurantRepository.save(updated);
        auditLogService.record("RESTAURANT", saved.getId(), "UPDATE_RESTAURANT_STATUS", requesterId,
                previousStatus + " → " + newStatus + " (" + saved.getName() + ")");
        return restaurantMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id, UUID requesterId, boolean isAdmin) {
        Restaurant existing = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
        if (!isAdmin && !existing.getOwnerId().equals(requesterId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No puedes eliminar un restaurante que no te pertenece");
        }
        restaurantRepository.deleteById(id);
        log.info("Restaurante eliminado (soft delete): {}", id);
    }

    private String generateUniqueSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");

        String slug = base;
        int counter = 1;
        while (restaurantRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
