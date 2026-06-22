package com.tingo.restaurants.application.mapper;

import com.tingo.restaurants.application.dto.response.RestaurantResponse;
import com.tingo.restaurants.application.dto.response.ScheduleResponse;
import com.tingo.restaurants.domain.model.FoodCategory;
import com.tingo.restaurants.domain.model.Restaurant;
import com.tingo.restaurants.domain.model.Schedule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface RestaurantMapper {

    @Mapping(target = "categories", expression = "java(mapCategoryNames(restaurant))")
    @Mapping(target = "categoryIds", expression = "java(mapCategoryIds(restaurant))")
    @Mapping(target = "priceRange", expression = "java(priceRange(restaurant))")
    @Mapping(target = "distanceKm", ignore = true)
    @Mapping(target = "isAccessible", source = "restaurant.accessible")
    RestaurantResponse toResponse(Restaurant restaurant);

    default String priceRange(Restaurant r) {
        if (r.getAvgDishPrice() == null) return null;
        double v = r.getAvgDishPrice().doubleValue();
        if (v < 15) return "LOW";
        if (v <= 35) return "MEDIUM";
        return "HIGH";
    }

    @Mapping(target = "isClosed", source = "closed")
    ScheduleResponse toScheduleResponse(Schedule schedule);

    default List<String> mapCategoryNames(Restaurant restaurant) {
        if (restaurant.getCategories() == null) return List.of();
        return restaurant.getCategories().stream()
                .map(FoodCategory::getName)
                .collect(Collectors.toList());
    }

    default List<UUID> mapCategoryIds(Restaurant restaurant) {
        if (restaurant.getCategories() == null) return List.of();
        return restaurant.getCategories().stream()
                .map(FoodCategory::getId)
                .collect(Collectors.toList());
    }
}
