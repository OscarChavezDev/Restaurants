package com.tingo.restaurants.infrastructure.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Cliente del Sistema de Eventos del ecosistema (Actify:
 * https://actify.qd.je/developers/portal). Dos usos:
 * 1) ubicar un evento por id (lat/lng) para resolver GET /restaurants/near-event/{eventId}
 *    contra la búsqueda geoespacial PostGIS ya existente;
 * 2) el inverso — listar eventos cerca de una coordenada, para mostrar en la
 *    página de un restaurante "eventos cerca de acá" (GET /restaurants/{id}/nearby-events).
 * Si no hay API key configurada, {@link #isConfigured()} es false y ambos caen
 * a vacío (mismo patrón de degradación que GeminiTextClient).
 */
@Slf4j
@Component
public class ActifyEventsClient {

    private final String apiKey;
    private final String baseUrl;
    private final RestClient http = RestClient.create();

    public ActifyEventsClient(@Value("${actify.api-key:}") String apiKey,
                               @Value("${actify.base-url:https://actify.qd.je/api/v1}") String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Ubicación de un evento (lat/lng + nombre/ciudad), o null si no existe / falla / no está configurado. */
    public EventLocation getEventLocation(String eventId) {
        if (!isConfigured()) return null;
        try {
            JsonNode resp = http.get()
                    .uri(baseUrl + "/events/{id}", eventId)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(JsonNode.class);
            if (resp == null) return null;

            JsonNode location = resp.path("location");
            if (location.isMissingNode() || location.isNull()) return null;

            BigDecimal latitude = new BigDecimal(location.path("latitude").asText());
            BigDecimal longitude = new BigDecimal(location.path("longitude").asText());
            String name = resp.path("name").asText(null);
            String city = location.path("city").asText(null);

            return new EventLocation(latitude, longitude, name, city);
        } catch (Exception e) {
            log.warn("No se pudo obtener el evento {} de Actify: {}", eventId, e.getMessage());
            return null;
        }
    }

    /** Eventos cerca de una coordenada, o lista vacía si falla / no hay resultados / no configurado. */
    public List<EventSummary> listNearby(BigDecimal latitude, BigDecimal longitude, double radiusKm) {
        if (!isConfigured()) return List.of();
        try {
            JsonNode resp = http.get()
                    .uri(baseUrl + "/events?location={lat},{lng}&radius={r}", latitude, longitude, radiusKm)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(JsonNode.class);
            if (resp == null || !resp.isArray()) return List.of();

            List<EventSummary> result = new ArrayList<>();
            for (JsonNode n : resp) {
                JsonNode capacity = n.path("capacity");
                result.add(new EventSummary(
                        n.path("id").asLong(),
                        n.path("name").asText(null),
                        n.path("start_date").asText(null),
                        n.path("end_date").asText(null),
                        n.path("location").path("city").asText(null),
                        n.path("category").path("name").asText(null),
                        capacity.path("available_spots").isMissingNode() ? null : capacity.path("available_spots").asInt(),
                        capacity.path("is_sold_out").asBoolean(false)
                ));
            }
            return result;
        } catch (Exception e) {
            log.warn("No se pudo listar eventos cercanos en Actify: {}", e.getMessage());
            return List.of();
        }
    }

    public record EventLocation(BigDecimal latitude, BigDecimal longitude, String name, String city) {}

    public record EventSummary(long id, String name, String startDate, String endDate, String city,
                                String category, Integer availableSpots, boolean soldOut) {}
}
