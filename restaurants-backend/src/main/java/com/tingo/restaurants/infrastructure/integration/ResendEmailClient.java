package com.tingo.restaurants.infrastructure.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;

/**
 * Cliente HTTP a la API de Resend (https://resend.com) para mandar correos.
 *
 * Reemplaza el SMTP tradicional (JavaMailSender + Gmail): Render bloquea las
 * conexiones salientes por los puertos SMTP (25/465/587) en todos sus planes,
 * así que el correo por SMTP nunca puede conectar desde ahí — no importa que
 * las credenciales sean correctas, el timeout es de red, no de autenticación.
 * Resend manda por HTTPS (443), que sí funciona.
 *
 * Si RESEND_API_KEY está vacía, se degrada sin romper nada (mismo patrón que
 * GeminiTextClient/ActifyEventsClient): loggea y no manda, en vez de lanzar.
 */
@Slf4j
@Component
public class ResendEmailClient {

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${resend.api-key:}")
    private String apiKey;

    @Value("${resend.from:onboarding@resend.dev}")
    private String defaultFrom;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void send(String to, String subject, String html) {
        send(to, subject, html, null, null, null);
    }

    /** inlineAttachment opcional (ej. el QR), referenciado en el HTML como cid:&lt;contentId&gt;. */
    public void send(String to, String subject, String html,
                      byte[] inlineAttachment, String contentId, String attachmentFilename) {
        if (!isConfigured()) {
            log.warn("RESEND_API_KEY no configurada — no se envía el correo '{}' a {}", subject, to);
            return;
        }
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("from", defaultFrom);
            body.putArray("to").add(to);
            body.put("subject", subject);
            body.put("html", html);
            if (inlineAttachment != null) {
                ObjectNode att = body.putArray("attachments").addObject();
                att.put("filename", attachmentFilename);
                att.put("content", Base64.getEncoder().encodeToString(inlineAttachment));
                att.put("content_id", contentId);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email '{}' enviado a {} (Resend)", subject, to);
            } else {
                log.error("Error enviando email a {} (Resend, HTTP {}): {}", to, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Error enviando email a {} (Resend): {}", to, e.getMessage());
        }
    }
}
