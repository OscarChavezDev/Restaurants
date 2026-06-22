package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.domain.model.enums.RestaurantStatus;
import com.tingo.restaurants.infrastructure.persistence.entity.RestaurantEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantJpaRepository extends JpaRepository<RestaurantEntity, UUID> {

    Optional<RestaurantEntity> findBySlugAndDeletedAtIsNull(String slug);

    Page<RestaurantEntity> findByStatusAndDeletedAtIsNull(RestaurantStatus status, Pageable pageable);

    Page<RestaurantEntity> findByOwnerIdAndDeletedAtIsNull(UUID ownerId, Pageable pageable);

    boolean existsBySlugAndDeletedAtIsNull(String slug);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    @Query(value = """
        SELECT * FROM restaurants r
        WHERE r.deleted_at IS NULL
          AND r.status = 'ACTIVE'
          AND (CAST(:name AS text) IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', CAST(:name AS text), '%')))
          AND (CAST(:city AS text) IS NULL OR LOWER(r.city) = LOWER(CAST(:city AS text)))
          AND (CAST(:categoryId AS uuid) IS NULL OR EXISTS (
                SELECT 1 FROM restaurant_food_categories rfc
                WHERE rfc.restaurant_id = r.id AND rfc.category_id = CAST(:categoryId AS uuid)))
          AND (CAST(:priceRange AS text) IS NULL OR (r.avg_dish_price IS NOT NULL AND (
                (:priceRange = 'LOW'    AND r.avg_dish_price < 15) OR
                (:priceRange = 'MEDIUM' AND r.avg_dish_price >= 15 AND r.avg_dish_price <= 35) OR
                (:priceRange = 'HIGH'   AND r.avg_dish_price > 35))))
        ORDER BY r.avg_rating DESC, r.total_ratings DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM restaurants r
        WHERE r.deleted_at IS NULL
          AND r.status = 'ACTIVE'
          AND (CAST(:name AS text) IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', CAST(:name AS text), '%')))
          AND (CAST(:city AS text) IS NULL OR LOWER(r.city) = LOWER(CAST(:city AS text)))
          AND (CAST(:categoryId AS uuid) IS NULL OR EXISTS (
                SELECT 1 FROM restaurant_food_categories rfc
                WHERE rfc.restaurant_id = r.id AND rfc.category_id = CAST(:categoryId AS uuid)))
          AND (CAST(:priceRange AS text) IS NULL OR (r.avg_dish_price IS NOT NULL AND (
                (:priceRange = 'LOW'    AND r.avg_dish_price < 15) OR
                (:priceRange = 'MEDIUM' AND r.avg_dish_price >= 15 AND r.avg_dish_price <= 35) OR
                (:priceRange = 'HIGH'   AND r.avg_dish_price > 35))))
        """,
        nativeQuery = true)
    Page<RestaurantEntity> findByFilters(
            @Param("name") String name,
            @Param("city") String city,
            @Param("categoryId") String categoryId,
            @Param("priceRange") String priceRange,
            Pageable pageable);

    @Query(value = """
        SELECT r.*, ST_Distance(
            CAST(r.geolocation AS geography),
            CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography)
        ) / 1000 AS distance_km
        FROM restaurants r
        WHERE r.deleted_at IS NULL
          AND r.status = 'ACTIVE'
          AND ST_DWithin(
              CAST(r.geolocation AS geography),
              CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography),
              :radiusMeters
          )
        ORDER BY distance_km ASC
        LIMIT 50
    """, nativeQuery = true)
    List<RestaurantEntity> findNearby(
            @Param("latitude") BigDecimal latitude,
            @Param("longitude") BigDecimal longitude,
            @Param("radiusMeters") double radiusMeters);
}
