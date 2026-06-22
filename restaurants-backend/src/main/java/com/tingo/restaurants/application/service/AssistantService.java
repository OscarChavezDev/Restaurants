package com.tingo.restaurants.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tingo.restaurants.application.dto.request.AssistantChatRequest;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationConfigEntity;
import com.tingo.restaurants.infrastructure.persistence.entity.ReservationEntity;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationConfigJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.ReservationJpaRepository;
import com.tingo.restaurants.infrastructure.persistence.repository.RestaurantJpaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Asistente con IA usando Gemini (capa gratuita de Google AI Studio) vía HTTP.
 * Si no hay API key, {@link #isConfigured()} es false y el frontend usa reglas.
 */
@Slf4j
@Service
public class AssistantService {

    private final ReservationJpaRepository reservationRepository;
    private final RestaurantJpaRepository restaurantRepository;
    private final ReservationConfigJpaRepository configRepository;
    private final String apiKey;
    private final String model;
    private final RestClient http = RestClient.create();

    public AssistantService(ReservationJpaRepository reservationRepository,
                            RestaurantJpaRepository restaurantRepository,
                            ReservationConfigJpaRepository configRepository,
                            @Value("${gemini.api-key:}") String apiKey,
                            @Value("${gemini.model:gemini-2.5-flash-lite}") String model) {
        this.reservationRepository = reservationRepository;
        this.restaurantRepository = restaurantRepository;
        this.configRepository = configRepository;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String chat(AssistantChatRequest req) {
        String system = buildSystemPrompt(req.getCode());

        List<Map<String, Object>> contents = new ArrayList<>();
        if (req.getMessages() != null) {
            for (var m : req.getMessages()) {
                if (m.getContent() == null || m.getContent().isBlank()) continue;
                String role = "assistant".equalsIgnoreCase(m.getRole()) ? "model" : "user";
                contents.add(Map.of("role", role, "parts", List.of(Map.of("text", m.getContent()))));
            }
        }
        if (contents.isEmpty()) {
            contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", "Hola"))));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", system))));
        body.put("contents", contents);
        body.put("generationConfig", Map.of("maxOutputTokens", 600, "temperature", 0.5));

        JsonNode resp = http.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={k}", model, apiKey)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        String text = resp == null ? "" : resp.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text").asText("");
        return text == null || text.isBlank()
                ? "No pude generar una respuesta en este momento. Intenta con los botones del asistente."
                : text.trim();
    }

    // ── Prompt ────────────────────────────────────────────────────────────
    private String buildSystemPrompt(String code) {
        StringBuilder sb = new StringBuilder();
        sb.append("Eres el asistente virtual de Tingo Restaurants, una plataforma de reservas de ")
          .append("restaurantes en Tingo María, Perú. Ayudas SOLO con temas de reservas: estado, ")
          .append("pago/adelanto, comprobante, alergias, horarios y cómo reservar. ")
          .append("Responde en español, breve, cordial y claro. NO uses emojis. ")
          .append("No puedes ejecutar acciones tú mismo (subir comprobante, guardar alergias): para ")
          .append("eso indícale al cliente que use los botones del asistente. ")
          .append("Si no conoces el código de la reserva del cliente, pídele que lo escriba ")
          .append("(formato RES-XXXXXXXX) para ayudarlo con su reserva específica.\n");

        if (code != null && !code.isBlank()) {
            reservationRepository.findByConfirmationCode(code.toUpperCase().trim()).ifPresent(r -> {
                sb.append("\nDatos de la reserva del cliente (úsalos para responder):\n");
                sb.append("- Código: ").append(r.getConfirmationCode()).append("\n");
                String restName = restaurantRepository.findById(r.getRestaurantId())
                        .map(x -> x.getName()).orElse("el restaurante");
                sb.append("- Restaurante: ").append(restName).append("\n");
                sb.append("- Cliente: ").append(r.getCustomerName()).append("\n");
                sb.append("- Estado: ").append(statusEs(r)).append("\n");
                sb.append("- Fecha: ").append(r.getReservationDate())
                  .append(" - Hora: ").append(EmailService.time12h(r.getStartTime())).append("\n");
                sb.append("- Personas: ").append(r.getPartySize()).append("\n");
                if (r.getAdvanceAmount() != null && r.getAdvanceAmount().signum() > 0) {
                    sb.append("- Adelanto requerido: S/ ").append(r.getAdvanceAmount())
                      .append(" (estado de pago: ").append(paymentEs(r.getPaymentStatus())).append(")\n");
                    ReservationConfigEntity cfg = configRepository.findByRestaurantId(r.getRestaurantId()).orElse(null);
                    if (cfg != null) {
                        if (cfg.getPaymentInfo() != null && !cfg.getPaymentInfo().isBlank()) {
                            sb.append("- Formas de pago del restaurante: ").append(cfg.getPaymentInfo()).append("\n");
                        }
                        if (cfg.getPaymentQrUrl() != null && !cfg.getPaymentQrUrl().isBlank()) {
                            sb.append("- El restaurante tiene un QR de pago (el cliente puede verlo con la opción \"pago\").\n");
                        }
                    }
                } else {
                    sb.append("- Esta reserva no requiere adelanto.\n");
                }
            });
        }
        return sb.toString();
    }

    private String statusEs(ReservationEntity r) {
        return switch (r.getStatus()) {
            case PENDING -> "Pendiente de confirmación";
            case CONFIRMED -> "Confirmada";
            case CANCELLED -> "Cancelada";
            case COMPLETED -> "Completada";
            case NO_SHOW -> "No se presentó";
        };
    }

    private String paymentEs(String s) {
        if (s == null) return "no requerido";
        return switch (s) {
            case "PENDING_PAYMENT" -> "pendiente de pago";
            case "PROOF_SUBMITTED" -> "comprobante enviado, en revisión";
            case "PAYMENT_VERIFIED" -> "verificado";
            default -> "no requerido";
        };
    }
}
