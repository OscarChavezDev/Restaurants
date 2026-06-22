package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.FoodCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FoodCategoryJpaRepository extends JpaRepository<FoodCategoryEntity, UUID> {
    List<FoodCategoryEntity> findByActiveTrueOrderByName();
}
