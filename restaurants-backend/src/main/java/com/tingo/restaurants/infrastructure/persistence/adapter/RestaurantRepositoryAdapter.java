package com.tingo.restaurants.infrastructure.persistence.adapter;

import com.tingo.restaurants.domain.model.FoodCategory;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.model.Schedule;
import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.FoodCategoryEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.ScheduleEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.FoodCategoryJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RestaurantRepositoryAdapter implements RestaurantRepository {

    private final RestaurantJpaRepository jpaRepository;
    private final FoodCategoryJpaRepository categoryJpaRepository;

    @Override
    public Restaurant save(Restaurant restaurant) {
        return toDomain(jpaRepository.save(toEntity(restaurant)));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Restaurant> findById(UUID id) {
        return jpaRepository.findById(id)
                .filter(e -> e.getDeletedAt() == null)
                .map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Restaurant> findBySlug(String slug) {
        return jpaRepository.findBySlugAndDeletedAtIsNull(slug).map(this::toDomain);
    }

    @Override
    public Page<Restaurant> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(this::toDomain);
    }

    @Override
    public Page<Restaurant> findByStatus(RestaurantStatus status, Pageable pageable) {
        return jpaRepository.findByStatusAndDeletedAtIsNull(status, pageable).map(this::toDomain);
    }

    @Override
    public Page<Restaurant> findByFilters(String name, String city, String categoryId, String priceRange,
                                           RestaurantStatus status, Pageable pageable) {
        return jpaRepository.findByFilters(name, city, categoryId, priceRange, pageable).map(this::toDomain);
    }

    @Override
    public List<Restaurant> findNearby(BigDecimal latitude, BigDecimal longitude, double radiusKm) {
        return jpaRepository.findNearby(latitude, longitude, radiusKm * 1000)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Restaurant> findNearbyEvent(UUID eventId, double radiusKm) {
        return List.of();
    }

    @Override
    public Page<Restaurant> findByOwnerId(UUID ownerId, Pageable pageable) {
        return jpaRepository.findByOwnerIdAndDeletedAtIsNull(ownerId, pageable).map(this::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.findById(id).ifPresent(e -> {
            e.softDelete();
            jpaRepository.save(e);
        });
    }

    @Override
    public boolean existsBySlug(String slug) {
        return jpaRepository.existsBySlugAndDeletedAtIsNull(slug);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmailAndDeletedAtIsNull(email);
    }

    // ─── Mapeo manual entity → domain ───────────────────────────────────────

    private Restaurant toDomain(RestaurantEntity e) {
        List<FoodCategory> cats = e.getCategories() == null ? List.of() :
                e.getCategories().stream().map(c -> FoodCategory.builder()
                        .id(c.getId()).name(c.getName())
                        .description(c.getDescription()).iconUrl(c.getIconUrl())
                        .isActive(c.isActive()).build())
                        .collect(Collectors.toList());

        List<Schedule> schedules = e.getSchedules() == null ? List.of() :
                e.getSchedules().stream().map(this::scheduleToDomain).collect(Collectors.toList());

        return Restaurant.builder()
                .id(e.getId()).ownerId(e.getOwnerId()).name(e.getName()).slug(e.getSlug())
                .description(e.getDescription()).phone(e.getPhone()).email(e.getEmail())
                .website(e.getWebsite()).ruc(e.getRuc()).status(e.getStatus())
                .address(e.getAddress()).district(e.getDistrict()).city(e.getCity())
                .region(e.getRegion()).latitude(e.getLatitude()).longitude(e.getLongitude())
                .totalCapacity(e.getTotalCapacity()).priceLevel(e.getPriceLevel()).avgDishPrice(e.getAvgDishPrice()).minReservationSize(e.getMinReservationSize())
                .maxReservationSize(e.getMaxReservationSize()).coverImageUrl(e.getCoverImageUrl())
                .logoUrl(e.getLogoUrl()).avgRating(e.getAvgRating()).totalRatings(e.getTotalRatings())
                .acceptsReservations(e.isAcceptsReservations()).acceptsEvents(e.isAcceptsEvents())
                .hasParking(e.isHasParking()).hasWifi(e.isHasWifi())
                .hasAirConditioning(e.isHasAirConditioning()).isAccessible(e.isAccessible())
                .categories(cats).schedules(schedules)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).deletedAt(e.getDeletedAt())
                .build();
    }

    private Schedule scheduleToDomain(ScheduleEntity s) {
        return Schedule.builder()
                .id(s.getId())
                .restaurantId(s.getRestaurant() != null ? s.getRestaurant().getId() : null)
                .dayOfWeek(s.getDayOfWeek())
                .openingTime(s.getOpeningTime())
                .closingTime(s.getClosingTime())
                .isClosed(s.isClosed())
                .build();
    }

    // ─── Mapeo manual domain → entity ───────────────────────────────────────

    private RestaurantEntity toEntity(Restaurant r) {
        RestaurantEntity e = new RestaurantEntity();
        e.setId(r.getId()); e.setOwnerId(r.getOwnerId()); e.setName(r.getName());
        e.setSlug(r.getSlug()); e.setDescription(r.getDescription()); e.setPhone(r.getPhone());
        e.setEmail(r.getEmail()); e.setWebsite(r.getWebsite()); e.setRuc(r.getRuc());
        e.setStatus(r.getStatus()); e.setAddress(r.getAddress()); e.setDistrict(r.getDistrict());
        e.setCity(r.getCity()); e.setRegion(r.getRegion()); e.setLatitude(r.getLatitude());
        e.setLongitude(r.getLongitude()); e.setTotalCapacity(r.getTotalCapacity()); e.setPriceLevel(r.getPriceLevel()); e.setAvgDishPrice(r.getAvgDishPrice()); e.setMinReservationSize(r.getMinReservationSize());
        e.setMaxReservationSize(r.getMaxReservationSize());
        e.setCoverImageUrl(r.getCoverImageUrl()); e.setLogoUrl(r.getLogoUrl());
        e.setAvgRating(r.getAvgRating()); e.setTotalRatings(r.getTotalRatings());
        e.setAcceptsReservations(r.isAcceptsReservations()); e.setAcceptsEvents(r.isAcceptsEvents());
        e.setHasParking(r.isHasParking()); e.setHasWifi(r.isHasWifi());
        e.setHasAirConditioning(r.isHasAirConditioning()); e.setAccessible(r.isAccessible());

        // Categorías (M:N): carga las entidades gestionadas a partir de los ids del dominio.
        if (r.getCategories() != null && !r.getCategories().isEmpty()) {
            List<UUID> ids = r.getCategories().stream()
                    .map(FoodCategory::getId)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            List<FoodCategoryEntity> cats = categoryJpaRepository.findAllById(ids);
            e.setCategories(cats);
        } else {
            e.setCategories(new java.util.ArrayList<>());
        }
        return e;
    }
}
