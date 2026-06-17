package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.response.RestaurantImageResponse;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantImageJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantImageService {

    private final RestaurantImageJpaRepository imageRepository;

    public List<RestaurantImageResponse> findByRestaurant(UUID restaurantId) {
        return imageRepository.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId)
                .stream()
                .map(img -> RestaurantImageResponse.builder()
                        .id(img.getId())
                        .restaurantId(img.getRestaurantId())
                        .url(img.getUrl())
                        .caption(img.getCaption())
                        .displayOrder(img.getDisplayOrder())
                        .createdAt(img.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
