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
          AND (CAST(:name AS text) IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (CAST(:city AS text) IS NULL OR LOWER(r.city) = LOWER(CAST(:city AS text)))
        ORDER BY r.avg_rating DESC, r.total_ratings DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM restaurants r
        WHERE r.deleted_at IS NULL
          AND r.status = 'ACTIVE'
          AND (CAST(:name AS text) IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (CAST(:city AS text) IS NULL OR LOWER(r.city) = LOWER(CAST(:city AS text)))
        """,
        nativeQuery = true)
    Page<RestaurantEntity> findByFilters(
            @Param("name") String name,
            @Param("city") String city,
            Pageable pageable);

    @Query(value = """
        SELECT r.*, ST_Distance(
            r.geolocation::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) / 1000 AS distance_km
        FROM restaurants r
        WHERE r.deleted_at IS NULL
          AND r.status = 'ACTIVE'
          AND ST_DWithin(
              r.geolocation::geography,
              ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
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
