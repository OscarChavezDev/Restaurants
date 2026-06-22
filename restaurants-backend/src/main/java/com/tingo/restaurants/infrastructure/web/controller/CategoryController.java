package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.dto.response.CategoryResponse;
import com.tingo.restaurants.infrastructure.persistence.repository.FoodCategoryJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categorías", description = "Catálogo de tipos de comida")
public class CategoryController {

    private final FoodCategoryJpaRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Listar categorías / tipos de comida (público)")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> findAll() {
        List<CategoryResponse> categories = categoryRepository.findByActiveTrueOrderByName()
                .stream()
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .iconUrl(c.getIconUrl())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }
}
