package com.tingo.restaurants.infrastructure.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Genera la firma para subir imágenes directo a Cloudinary desde el frontend
 * (signed upload). El secreto nunca sale del backend; el frontend solo recibe
 * firma + timestamp + apiKey + cloudName y sube el archivo directo al CDN.
 */
@Slf4j
@Component
public class CloudinarySignatureService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.folder:tingo-restaurants}")
    private String baseFolder;

    public boolean isConfigured() {
        return !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    public Map<String, Object> sign(String subfolder) {
        long timestamp = System.currentTimeMillis() / 1000L;
        String folder = (subfolder != null && !subfolder.isBlank())
                ? baseFolder + "/" + subfolder.replaceAll("[^a-zA-Z0-9_-]", "")
                : baseFolder;

        // Parámetros a firmar en orden alfabético: folder, timestamp.
        String toSign = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
        String signature = sha1Hex(toSign);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cloudName", cloudName);
        result.put("apiKey", apiKey);
        result.put("timestamp", timestamp);
        result.put("folder", folder);
        result.put("signature", signature);
        return result;
    }

    /**
     * Sube bytes de imagen directo desde el backend (a diferencia de {@link #sign}, que solo
     * firma para que el frontend suba directo al CDN). Se usa para assets generados por IA
     * (fondo del flyer de promociones) que nunca pasan por el navegador del cliente.
     * Devuelve la secure_url, o null si no está configurado / falla la subida.
     */
    public String uploadImage(byte[] bytes, String subfolder) {
        if (!isConfigured()) return null;
        try {
            long timestamp = System.currentTimeMillis() / 1000L;
            String folder = (subfolder != null && !subfolder.isBlank())
                    ? baseFolder + "/" + subfolder.replaceAll("[^a-zA-Z0-9_-]", "")
                    : baseFolder;
            String toSign = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
            String signature = sha1Hex(toSign);

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(bytes)).filename("flyer.png");
            builder.part("api_key", apiKey);
            builder.part("timestamp", String.valueOf(timestamp));
            builder.part("folder", folder);
            builder.part("signature", signature);

            JsonNode resp = RestClient.create().post()
                    .uri("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(JsonNode.class);
            return resp != null ? resp.path("secure_url").asText(null) : null;
        } catch (Exception e) {
            log.warn("Subida a Cloudinary falló: {}", e.getMessage());
            return null;
        }
    }

    private String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar la firma de subida", e);
        }
    }
}
