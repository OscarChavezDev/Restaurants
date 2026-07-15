package com.tingo.restaurants.domain.repository;

import com.tingo.restaurants.domain.model.ApiKey;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository {

    ApiKey save(ApiKey apiKey);

    Optional<ApiKey> findByKeyHash(String keyHash);

    List<ApiKey> findByUserId(UUID userId);

    Optional<ApiKey> findByIdAndUserId(UUID id, UUID userId);

    void touchLastUsed(UUID id, LocalDateTime when);
}
