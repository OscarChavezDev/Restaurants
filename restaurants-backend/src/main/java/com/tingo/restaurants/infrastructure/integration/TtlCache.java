package com.tingo.restaurants.infrastructure.integration;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache en memoria con expiración simple, para respuestas de clientes de
 * integración externos (Actify, Hospy): evita repetir la llamada HTTP en
 * cada carga de página para el mismo restaurante. Una sola instancia
 * (mismo enfoque y misma limitación que LoginAttemptService/ApiKeyRateLimiter
 * — para multi-instancia habría que pasar a Redis).
 */
class TtlCache<K, V> {

    private static final class Entry<V> {
        final V value;
        final long expiresAtMs;
        Entry(V value, long expiresAtMs) {
            this.value = value;
            this.expiresAtMs = expiresAtMs;
        }
    }

    private final ConcurrentHashMap<K, Entry<V>> store = new ConcurrentHashMap<>();
    private final long ttlMs;

    TtlCache(long ttlMs) {
        this.ttlMs = ttlMs;
    }

    V get(K key) {
        Entry<V> e = store.get(key);
        if (e == null) return null;
        if (System.currentTimeMillis() > e.expiresAtMs) {
            store.remove(key);
            return null;
        }
        return e.value;
    }

    void put(K key, V value) {
        store.put(key, new Entry<>(value, System.currentTimeMillis() + ttlMs));
    }
}
