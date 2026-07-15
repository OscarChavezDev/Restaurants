package com.tingo.restaurants.application.service;

import com.tingo.restaurants.application.dto.request.GenerateApiKeyRequest;
import com.tingo.restaurants.application.dto.response.ApiKeyCreatedResponse;
import com.tingo.restaurants.application.dto.response.ApiKeyResponse;
import com.tingo.restaurants.domain.exception.ApiKeyNotFoundException;
import com.tingo.restaurants.domain.model.ApiKey;
import com.tingo.restaurants.domain.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Genera, lista y revoca las API keys autoservicio del portal de desarrollador.
 * La clave completa (rawKey) se devuelve UNA sola vez, en el momento de crearla:
 * a partir de ahí solo se guarda su hash SHA-256 (búsqueda O(1) por índice — a
 * diferencia de bcrypt, que no permite un lookup directo por su salt aleatorio;
 * un secreto de 256 bits generado por SecureRandom no necesita el hashing lento
 * de bcrypt, pensado para contraseñas humanas de baja entropía).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiKeyService {

    private static final String KEY_PREFIX = "rp_live_";
    private static final int RANDOM_BYTES = 32;

    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public ApiKeyCreatedResponse generate(UUID userId, GenerateApiKeyRequest request) {
        return createAndSave(userId, request.getName());
    }

    public List<ApiKeyResponse> listForUser(UUID userId) {
        return apiKeyRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void revoke(UUID userId, UUID keyId) {
        ApiKey apiKey = apiKeyRepository.findByIdAndUserId(keyId, userId)
                .orElseThrow(() -> new ApiKeyNotFoundException(keyId));
        apiKeyRepository.save(apiKey.toBuilder().revokedAt(LocalDateTime.now()).build());
        log.info("API key revocada por usuario {}: {}", userId, apiKey.getKeyPrefix());
    }

    /**
     * El valor real de una clave no se puede volver a mostrar (solo se guarda su
     * hash, de un solo sentido) — si el desarrollador la perdió, la única salida
     * es esta: revocar la vieja y crear una nueva con el mismo nombre, en un solo paso.
     */
    @Transactional
    public ApiKeyCreatedResponse regenerate(UUID userId, UUID keyId) {
        ApiKey oldKey = apiKeyRepository.findByIdAndUserId(keyId, userId)
                .orElseThrow(() -> new ApiKeyNotFoundException(keyId));
        apiKeyRepository.save(oldKey.toBuilder().revokedAt(LocalDateTime.now()).build());
        log.info("API key regenerada por usuario {}: {} → nueva clave con el mismo nombre", userId, oldKey.getKeyPrefix());
        return createAndSave(userId, oldKey.getName());
    }

    private ApiKeyCreatedResponse createAndSave(UUID userId, String name) {
        byte[] randomBytes = new byte[RANDOM_BYTES];
        secureRandom.nextBytes(randomBytes);
        String randomPart = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String rawKey = KEY_PREFIX + randomPart;
        String keyPrefix = KEY_PREFIX + randomPart.substring(0, 8);

        ApiKey apiKey = ApiKey.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .name(name)
                .keyPrefix(keyPrefix)
                .keyHash(hash(rawKey))
                .createdAt(LocalDateTime.now())
                .build();

        ApiKey saved = apiKeyRepository.save(apiKey);
        log.info("API key generada por usuario {}: {}", userId, saved.getKeyPrefix());

        return ApiKeyCreatedResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .rawKey(rawKey)
                .keyPrefix(saved.getKeyPrefix())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    /**
     * Usado por {@code ApiKeyAuthenticationFilter} en cada request autenticado por key:
     * valida, actualiza last_used_at, y devuelve la key completa (userId para cargar el
     * UserDetails, id para el rate limiter que se clavea por key, no por usuario).
     */
    @Transactional
    public Optional<ApiKey> validateAndTouch(String rawKey) {
        Optional<ApiKey> found = apiKeyRepository.findByKeyHash(hash(rawKey))
                .filter(k -> !k.isRevoked());
        found.ifPresent(k -> apiKeyRepository.touchLastUsed(k.getId(), LocalDateTime.now()));
        return found;
    }

    private ApiKeyResponse toResponse(ApiKey k) {
        return ApiKeyResponse.builder()
                .id(k.getId())
                .name(k.getName())
                .keyPrefix(k.getKeyPrefix())
                .createdAt(k.getCreatedAt())
                .lastUsedAt(k.getLastUsedAt())
                .revoked(k.isRevoked())
                .build();
    }

    private String hash(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
