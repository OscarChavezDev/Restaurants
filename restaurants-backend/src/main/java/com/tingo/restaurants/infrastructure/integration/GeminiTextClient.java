package com.tingo.restaurants.infrastructure.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Cliente reutilizable de Gemini (texto) por HTTP. Usa la capa gratuita de
 * Google AI Studio. Si no hay API key, {@link #isConfigured()} es false.
 */
@Slf4j
@Component
public class GeminiTextClient {

    private final String apiKey;
    private final String model;
    private final RestClient http = RestClient.create();

    public GeminiTextClient(@Value("${gemini.api-key:}") String apiKey,
                            @Value("${gemini.model:gemini-2.5-flash-lite}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Devuelve el texto generado, o null si falla / no está configurado. */
    public String complete(String system, String userMessage, int maxTokens) {
        if (!isConfigured()) return null;
        try {
            Map<String, Object> body = Map.of(
                    "systemInstruction", Map.of("parts", List.of(Map.of("text", system))),
                    "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))),
                    "generationConfig", Map.of("maxOutputTokens", maxTokens, "temperature", 0.9)
            );
            JsonNode resp = http.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={k}", model, apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            String text = resp == null ? null : resp.path("candidates").path(0)
                    .path("content").path("parts").path(0).path("text").asText(null);
            return text == null || text.isBlank() ? null : text.trim();
        } catch (Exception e) {
            log.warn("Gemini (texto) falló: {}", e.getMessage());
            return null;
        }
    }
}
