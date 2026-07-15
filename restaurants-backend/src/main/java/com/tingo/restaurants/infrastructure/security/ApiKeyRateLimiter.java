package com.tingo.restaurants.infrastructure.security;

import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Límite de tasa por API key (no por usuario ni por IP): ventana fija de 60
 * segundos, MAX_REQUESTS_PER_MINUTE solicitudes. En memoria, una sola instancia
 * (mismo enfoque y misma limitación documentada que LoginAttemptService — para
 * multi-instancia habría que pasar a un contador respaldado por Redis).
 */
@Component
public class ApiKeyRateLimiter {

    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final long WINDOW_MS = 60 * 1000L;

    private static class Window {
        volatile long windowStartMs = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);
    }

    private final ConcurrentHashMap<UUID, Window> store = new ConcurrentHashMap<>();

    /** true si la solicitud puede pasar; false si ya se superó el límite de la ventana actual. */
    public boolean tryConsume(UUID apiKeyId) {
        Window w = store.computeIfAbsent(apiKeyId, k -> new Window());
        long now = System.currentTimeMillis();

        synchronized (w) {
            if (now - w.windowStartMs >= WINDOW_MS) {
                w.windowStartMs = now;
                w.count.set(0);
            }
            return w.count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}
