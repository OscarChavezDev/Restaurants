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
 * Cliente del Sistema de Hospedaje del ecosistema (Hospy: https://hospy.pages.dev/).
 * Se usa para mostrar hospedajes cercanos a un restaurante (GET
 * /restaurants/{id}/nearby-lodging), consumiendo su endpoint público de
 * "cercanos". A diferencia de Actify (Authorization: Bearer), Hospy usa un
 * header propio: X-Hospy-Integration-Key. Degrada a lista vacía si no está
 * configurado o falla (mismo patrón que ActifyEventsClient/GeminiTextClient).
 */
@Slf4j
@Component
public class HospyLodgingClient {

    private final String apiKey;
    private final String baseUrl;
    private final RestClient http = RestClient.create();

    public HospyLodgingClient(@Value("${hospy.api-key:}") String apiKey,
                               @Value("${hospy.base-url:https://hospy-api-wm7v5futiq-rj.a.run.app/api/v1}") String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Hospedajes cercanos a una coordenada, ordenados por distancia. Lista vacía si falla / no configurado. */
    public List<Lodging> findNearby(BigDecimal latitude, BigDecimal longitude, double radiusKm) {
        if (!isConfigured()) return List.of();
        try {
            JsonNode resp = http.get()
                    .uri(baseUrl + "/integracion/hospedajes/cercanos/?lat={lat}&lng={lng}&radio_km={r}",
                            latitude, longitude, radiusKm)
                    .header("X-Hospy-Integration-Key", apiKey)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(JsonNode.class);
            if (resp == null || !resp.isArray()) return List.of();

            List<Lodging> result = new ArrayList<>();
            for (JsonNode n : resp) {
                result.add(new Lodging(
                        n.path("id").asLong(),
                        n.path("name").asText(null),
                        n.path("type").asText(null),
                        n.path("city").asText(null),
                        n.path("precio_desde").isNull() ? null : n.path("precio_desde").decimalValue(),
                        n.path("foto_principal").asText(null),
                        n.path("distance_km").isNull() ? null : n.path("distance_km").decimalValue()
                ));
            }
            return result;
        } catch (Exception e) {
            log.warn("No se pudo consultar hospedajes cercanos en Hospy: {}", e.getMessage());
            return List.of();
        }
    }

    public record Lodging(long id, String name, String type, String city,
                           BigDecimal priceFrom, String photoUrl, BigDecimal distanceKm) {}
}
