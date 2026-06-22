package com.tingo.restaurants.infrastructure.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extrae lat/lng de un enlace de Google Maps. Los enlaces cortos
 * (maps.app.goo.gl / goo.gl/maps) son redirecciones que no contienen
 * coordenadas, así que se siguen del lado del servidor y se parsea la URL
 * final (y, si hace falta, el cuerpo HTML).
 */
@Slf4j
@Component
public class MapsLinkResolver {

    private final HttpClient client = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    // El pin real va en !3d<lat>!4d<lng>; tiene prioridad sobre @ (centro del mapa).
    private static final Pattern[] PATTERNS = {
            Pattern.compile("!3d(-?\\d+(?:\\.\\d+)?)!4d(-?\\d+(?:\\.\\d+)?)"),
            Pattern.compile("@(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)"),
            Pattern.compile("[?&](?:q|ll|destination|center|sll)=(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)"),
    };

    private static final Pattern PLACE_NAME = Pattern.compile("/place/([^/@]+)");

    /** Resultado: coordenadas + nombre del lugar (si se pudo extraer). */
    public record ResolvedLocation(double lat, double lng, String name) {}

    /** Devuelve la ubicación o null si no se pudo determinar. */
    public ResolvedLocation resolve(String url) {
        if (url == null || url.isBlank()) return null;
        String trimmed = url.trim();

        // Caso enlace completo: las coords ya están en la URL.
        double[] direct = parse(trimmed);
        if (direct != null) return new ResolvedLocation(direct[0], direct[1], extractName(trimmed));

        // Caso enlace corto u otro: seguir redirecciones y parsear URL final + cuerpo.
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(trimmed))
                    .header("User-Agent", "Mozilla/5.0 (compatible; TingoRestaurants/1.0)")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            String finalUrl = response.uri().toString();
            double[] fromUri = parse(finalUrl);
            if (fromUri != null) return new ResolvedLocation(fromUri[0], fromUri[1], extractName(finalUrl));

            double[] fromBody = parse(response.body());
            if (fromBody != null) return new ResolvedLocation(fromBody[0], fromBody[1], extractName(finalUrl));

            return null;
        } catch (Exception e) {
            log.warn("No se pudo resolver el enlace de mapas {}: {}", trimmed, e.getMessage());
            return null;
        }
    }

    private String extractName(String url) {
        Matcher m = PLACE_NAME.matcher(url);
        if (m.find()) {
            try {
                return URLDecoder.decode(m.group(1), StandardCharsets.UTF_8).replace('+', ' ').trim();
            } catch (Exception ignored) {
                return m.group(1).replace('+', ' ');
            }
        }
        return null;
    }

    private double[] parse(String s) {
        if (s == null) return null;
        for (Pattern p : PATTERNS) {
            Matcher m = p.matcher(s);
            if (m.find()) {
                double lat = Double.parseDouble(m.group(1));
                double lng = Double.parseDouble(m.group(2));
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return new double[]{ round6(lat), round6(lng) };
                }
            }
        }
        return null;
    }

    private double round6(double n) {
        return Math.round(n * 1_000_000d) / 1_000_000d;
    }
}
