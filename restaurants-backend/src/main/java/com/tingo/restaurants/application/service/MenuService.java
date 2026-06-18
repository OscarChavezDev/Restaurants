package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.CreateMenuRequest;
import com.tingo.restaurants.application.dto.response.MenuResponse;
import com.tingo.restaurants.application.dto.response.DishResponse;
import com.tingo.restaurants.domain.exception.RestaurantNotFoundException;
import com.tingo.restaurants.domain.model.Menu;
import com.tingo.restaurants.domain.model.Dish;
import com.tingo.restaurants.domain.exception.DomainException;
import com.tingo.restaurants.domain.repository.MenuRepository;
import com.tingo.restaurants.domain.repository.RestaurantRepository;
import com.tingo.restaurants.infrastructure.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService {

    private final MenuRepository menuRepository;
    private final RestaurantRepository restaurantRepository;
    private final OwnershipGuard ownershipGuard;

    @Transactional
    public MenuResponse create(CreateMenuRequest request) {
        restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new RestaurantNotFoundException(request.getRestaurantId()));
        ownershipGuard.assertOwnsRestaurant(request.getRestaurantId());

        Menu menu = Menu.builder()
                .id(UUID.randomUUID())
                .restaurantId(request.getRestaurantId())
                .name(request.getName())
                .description(request.getDescription())
                .isActive(request.isActive())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .dishes(List.of())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Menu saved = menuRepository.save(menu);
        log.info("Menú creado: {} para restaurante: {}", saved.getId(), request.getRestaurantId());
        return toResponse(saved);
    }

    public List<MenuResponse> findByRestaurant(UUID restaurantId) {
        return menuRepository.findByRestaurantId(restaurantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MenuResponse> findActiveByRestaurant(UUID restaurantId) {
        return menuRepository.findActiveByRestaurantId(restaurantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new DomainException("Menú no encontrado", "MENU_NOT_FOUND") {});
        ownershipGuard.assertOwnsRestaurant(menu.getRestaurantId());
        menuRepository.deleteById(id);
    }

    private MenuResponse toResponse(Menu m) {
        List<DishResponse> dishes = m.getDishes() == null ? List.of() :
                m.getDishes().stream().map(d -> DishResponse.builder()
                        .id(d.getId()).name(d.getName()).description(d.getDescription())
                        .category(d.getCategory()).price(d.getPrice())
                        .preparationTime(d.getPreparationTime()).calories(d.getCalories())
                        .imageUrl(d.getImageUrl()).isAvailable(d.isAvailable())
                        .isFeatured(d.isFeatured()).isVegetarian(d.isVegetarian())
                        .isVegan(d.isVegan()).isGlutenFree(d.isGlutenFree())
                        .allergens(d.getAllergens()).build())
                        .collect(Collectors.toList());

        return MenuResponse.builder()
                .id(m.getId()).restaurantId(m.getRestaurantId()).name(m.getName())
                .description(m.getDescription()).isActive(m.isActive())
                .validFrom(m.getValidFrom()).validUntil(m.getValidUntil())
                .dishes(dishes).createdAt(m.getCreatedAt()).build();
    }
}
