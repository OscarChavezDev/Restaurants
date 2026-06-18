package com.tingo.restaurants.infrastructure.security;

import com.tingo.restaurants.domain.exception.TooManyAttemptsException;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Limita los intentos de inicio de sesión por email: tras MAX_ATTEMPTS fallos
 * consecutivos, bloquea el login durante LOCK_MINUTES. En memoria (suficiente
 * para una sola instancia); para multi-instancia usar Redis.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 10;
    private static final long LOCK_MS = 15 * 60 * 1000L; // 15 minutos

    private static class Counter {
        final AtomicInteger fails = new AtomicInteger(0);
        volatile long lockedUntil = 0L;
    }

    private final ConcurrentHashMap<String, Counter> store = new ConcurrentHashMap<>();

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Lanza TooManyAttemptsException si el email está bloqueado actualmente. */
    public void checkBlocked(String email) {
        Counter c = store.get(key(email));
        if (c != null && c.lockedUntil > System.currentTimeMillis()) {
            long minutes = (c.lockedUntil - System.currentTimeMillis()) / 60000 + 1;
            throw new TooManyAttemptsException(
                    "Demasiados intentos fallidos. Intenta de nuevo en " + minutes + " minuto(s).");
        }
    }

    public void loginFailed(String email) {
        Counter c = store.computeIfAbsent(key(email), k -> new Counter());
        // Si el bloqueo ya expiró, reinicia el contador.
        if (c.lockedUntil != 0 && c.lockedUntil <= System.currentTimeMillis()) {
            c.fails.set(0);
            c.lockedUntil = 0L;
        }
        if (c.fails.incrementAndGet() >= MAX_ATTEMPTS) {
            c.lockedUntil = System.currentTimeMillis() + LOCK_MS;
        }
    }

    public void loginSucceeded(String email) {
        store.remove(key(email));
    }
}
