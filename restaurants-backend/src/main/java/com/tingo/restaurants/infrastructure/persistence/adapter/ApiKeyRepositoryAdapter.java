package com.tingo.restaurants.infrastructure.persistence.adapter;

import com.tingo.restaurants.domain.model.ApiKey;
import com.tingo.restaurants.domain.repository.ApiKeyRepository;
import com.tingo.restaurants.infrastructure.persistence.entity.ApiKeyEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.ApiKeyJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ApiKeyRepositoryAdapter implements ApiKeyRepository {

    private final ApiKeyJpaRepository jpaRepository;

    @Override
    public ApiKey save(ApiKey apiKey) {
        return toDomain(jpaRepository.save(toEntity(apiKey)));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ApiKey> findByKeyHash(String keyHash) {
        return jpaRepository.findByKeyHash(keyHash).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApiKey> findByUserId(UUID userId) {
        return jpaRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ApiKey> findByIdAndUserId(UUID id, UUID userId) {
        return jpaRepository.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    @Transactional
    public void touchLastUsed(UUID id, LocalDateTime when) {
        jpaRepository.touchLastUsed(id, when);
    }

    // ─── Mapeo manual ────────────────────────────────────────────────────────

    private ApiKey toDomain(ApiKeyEntity e) {
        return ApiKey.builder()
                .id(e.getId()).userId(e.getUserId()).name(e.getName())
                .keyPrefix(e.getKeyPrefix()).keyHash(e.getKeyHash())
                .createdAt(e.getCreatedAt()).lastUsedAt(e.getLastUsedAt())
                .revokedAt(e.getRevokedAt())
                .build();
    }

    private ApiKeyEntity toEntity(ApiKey k) {
        return ApiKeyEntity.builder()
                .id(k.getId()).userId(k.getUserId()).name(k.getName())
                .keyPrefix(k.getKeyPrefix()).keyHash(k.getKeyHash())
                .createdAt(k.getCreatedAt()).lastUsedAt(k.getLastUsedAt())
                .revokedAt(k.getRevokedAt())
                .build();
    }
}
