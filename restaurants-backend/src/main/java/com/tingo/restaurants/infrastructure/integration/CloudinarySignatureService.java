package com.tingo.restaurants.infrastructure.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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
