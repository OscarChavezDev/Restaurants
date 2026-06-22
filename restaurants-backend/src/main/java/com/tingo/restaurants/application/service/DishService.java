package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.CreateDishRequest;
import com.tingo.restaurants.application.dto.request.UpdateDishRequest;
import com.tingo.restaurants.application.dto.response.DishResponse;
import com.tingo.restaurants.domain.exception.DomainException;
import com.tingo.restaurants.domain.model.Dish;
import com.tingo.restaurants.domain.repository.DishRepository;
import com.tingo.restaurants.domain.repository.MenuRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.DishJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DishService {

    private final DishRepository dishRepository;
    private final MenuRepository menuRepository;
    private final OwnershipGuard ownershipGuard;
    private final DishJpaRepository dishJpaRepository;
    private final RestaurantJpaRepository restaurantJpaRepository;

    /** Recalcula el precio promedio del menú (platos disponibles) y lo guarda en el restaurante. */
    @Transactional
    public void recalcAvgPrice(UUID restaurantId) {
        if (restaurantId == null) return;
        BigDecimal avg = dishJpaRepository.avgAvailablePrice(restaurantId);
        restaurantJpaRepository.findById(restaurantId).ifPresent(r -> {
            r.setAvgDishPrice(avg);
            restaurantJpaRepository.save(r);
        });
    }

    @Transactional
    public DishResponse create(CreateDishRequest request) {
        var menu = menuRepository.findById(request.getMenuId())
                .orElseThrow(() -> new DomainException("Menú no encontrado", "MENU_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(menu.getRestaurantId());

        Dish dish = Dish.builder()
                .id(UUID.randomUUID())
                .menuId(request.getMenuId())
                .restaurantId(menu.getRestaurantId())
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .preparationTime(request.getPreparationTime())
                .calories(request.getCalories())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.isAvailable())
                .isFeatured(request.isFeatured())
                .isVegetarian(request.isVegetarian())
                .isVegan(request.isVegan())
                .isGlutenFree(request.isGlutenFree())
                .allergens(request.getAllergens())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Dish saved = dishRepository.save(dish);
        recalcAvgPrice(menu.getRestaurantId());
        log.info("Plato creado: {} en menú: {}", saved.getName(), request.getMenuId());
        return toResponse(saved);
    }

    public List<DishResponse> findByMenu(UUID menuId) {
        return dishRepository.findByMenuId(menuId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Platos disponibles de un restaurante (para el pre-pedido al reservar, S10-07). */
    public List<DishResponse> findAvailableByRestaurant(UUID restaurantId) {
        return dishJpaRepository.findByRestaurantIdAndDeletedAtIsNull(restaurantId).stream()
                .filter(com.tingo.restaurants.infrastructure.persistence.entity.DishEntity::isAvailable)
                .map(d -> DishResponse.builder()
                        .id(d.getId()).name(d.getName()).description(d.getDescription())
                        .category(d.getCategory()).price(d.getPrice()).imageUrl(d.getImageUrl())
                        .isAvailable(d.isAvailable()).build())
                .collect(Collectors.toList());
    }

    public DishResponse findById(UUID dishId) {
        return dishRepository.findById(dishId)
                .map(this::toResponse)
                .orElseThrow(() -> new DomainException("Plato no encontrado", "DISH_NOT_FOUND") {});
    }

    @Transactional
    public DishResponse update(UUID dishId, UpdateDishRequest request) {
        Dish existing = dishRepository.findById(dishId)
                .orElseThrow(() -> new DomainException("Plato no encontrado", "DISH_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(existing.getRestaurantId());

        Dish.DishBuilder builder = existing.toBuilder().updatedAt(LocalDateTime.now());
        if (request.getName() != null) builder.name(request.getName());
        if (request.getDescription() != null) builder.description(request.getDescription());
        if (request.getCategory() != null) builder.category(request.getCategory());
        if (request.getPrice() != null) builder.price(request.getPrice());
        if (request.getPreparationTime() != null) builder.preparationTime(request.getPreparationTime());
        if (request.getCalories() != null) builder.calories(request.getCalories());
        if (request.getImageUrl() != null) builder.imageUrl(request.getImageUrl());
        if (request.getAvailable() != null) builder.isAvailable(request.getAvailable());
        if (request.getFeatured() != null) builder.isFeatured(request.getFeatured());
        if (request.getVegetarian() != null) builder.isVegetarian(request.getVegetarian());
        if (request.getVegan() != null) builder.isVegan(request.getVegan());
        if (request.getGlutenFree() != null) builder.isGlutenFree(request.getGlutenFree());
        if (request.getAllergens() != null) builder.allergens(request.getAllergens());

        Dish saved = dishRepository.save(builder.build());
        recalcAvgPrice(existing.getRestaurantId());
        log.info("Plato actualizado: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public DishResponse toggleAvailability(UUID dishId) {
        Dish existing = dishRepository.findById(dishId)
                .orElseThrow(() -> new DomainException("Plato no encontrado", "DISH_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(existing.getRestaurantId());

        Dish toggled = existing.toBuilder()
                .isAvailable(!existing.isAvailable())
                .updatedAt(LocalDateTime.now())
                .build();

        Dish saved = dishRepository.save(toggled);
        recalcAvgPrice(existing.getRestaurantId());
        log.info("Plato {} disponibilidad cambiada a: {}", saved.getId(), saved.isAvailable());
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Dish existing = dishRepository.findById(id)
                .orElseThrow(() -> new DomainException("Plato no encontrado", "DISH_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(existing.getRestaurantId());
        dishRepository.deleteById(id);
        recalcAvgPrice(existing.getRestaurantId());
    }

    private DishResponse toResponse(Dish d) {
        return DishResponse.builder()
                .id(d.getId()).name(d.getName()).description(d.getDescription())
                .category(d.getCategory()).price(d.getPrice())
                .preparationTime(d.getPreparationTime()).calories(d.getCalories())
                .imageUrl(d.getImageUrl()).isAvailable(d.isAvailable()).isFeatured(d.isFeatured())
                .isVegetarian(d.isVegetarian()).isVegan(d.isVegan()).isGlutenFree(d.isGlutenFree())
                .allergens(d.getAllergens()).build();
    }
}
