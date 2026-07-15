package com.tingo.restaurants.infrastructure.persistence.repository;

import com.tingo.restaurants.infrastructure.persistence.entity.ApiKeyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyJpaRepository extends JpaRepository<ApiKeyEntity, UUID> {

    Optional<ApiKeyEntity> findByKeyHash(String keyHash);

    List<ApiKeyEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<ApiKeyEntity> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("UPDATE ApiKeyEntity e SET e.lastUsedAt = :when WHERE e.id = :id")
    void touchLastUsed(@Param("id") UUID id, @Param("when") LocalDateTime when);
}
