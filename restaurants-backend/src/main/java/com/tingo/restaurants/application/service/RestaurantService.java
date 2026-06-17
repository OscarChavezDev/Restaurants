package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.CreateRestaurantRequest;
import com.tingo.restaurants.application.dto.response.PagedResponse;
import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.application.dto.response.ScheduleResponse;
import com.tingo.restaurants.application.mapper.RestaurantMapper;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.model.Schedule;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
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
                                                     String category, Pageable pageable) {
        Page<RestaurantResponse> page = restaurantRepository
                .findByFilters(name, city, category, RestaurantStatus.ACTIVE, pageable)
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

    public List<RestaurantResponse> findNearbyEvent(UUID eventId, double radiusKm) {
        return restaurantRepository.findNearbyEvent(eventId, radiusKm)
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
    public RestaurantResponse updateStatus(UUID id, RestaurantStatus newStatus) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));

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
                .avgRating(restaurant.getAvgRating())
                .totalRatings(restaurant.getTotalRatings())
                .build();

        return restaurantMapper.toResponse(restaurantRepository.save(updated));
    }

    @Transactional
    public void delete(UUID id) {
        restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException(id));
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
