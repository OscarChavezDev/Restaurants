package com.tingo.restaurants.infrastructure.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Cliente de Gemini para generación de imágenes (fondo artístico del flyer de
 * promociones). Reutiliza la misma API key de Google AI Studio que
 * {@link GeminiTextClient}. Si falla o no está configurado, degrada a null —
 * el frontend usa un degradado de marca como respaldo (mismo patrón que el
 * resto de integraciones de IA de este servicio).
 */
@Slf4j
@Component
public class GeminiImageClient {

    private final String apiKey;
    private final String model;
    private final RestClient http = RestClient.create();

    public GeminiImageClient(@Value("${gemini.api-key:}") String apiKey,
                              @Value("${gemini.image-model:gemini-2.5-flash-image}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Devuelve los bytes de la imagen (PNG/JPEG) generada, o null si falla / no está configurado. */
    public byte[] generateImage(String prompt) {
        if (!isConfigured()) return null;
        try {
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("responseModalities", List.of("IMAGE", "TEXT"))
            );
            JsonNode resp = http.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={k}", model, apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            if (resp == null) return null;

            for (JsonNode part : resp.path("candidates").path(0).path("content").path("parts")) {
                JsonNode inline = part.path("inlineData");
                if (inline.has("data")) {
                    return Base64.getDecoder().decode(inline.get("data").asText());
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("Gemini (imagen) falló: {}", e.getMessage());
            return null;
        }
    }
}
