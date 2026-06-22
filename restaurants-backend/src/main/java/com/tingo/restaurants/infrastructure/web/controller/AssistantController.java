package com.tingo.restaurants.infrastructure.web.controller;

import com.tingo.restaurants.application.dto.request.AssistantChatRequest;
import com.tingo.restaurants.application.dto.response.ApiResponse;
import com.tingo.restaurants.application.service.AssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/assistant")
@RequiredArgsConstructor
@Tag(name = "Asistente", description = "Asistente de reservas con IA (Gemini)")
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/chat")
    @Operation(summary = "Conversar con el asistente de reservas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(@RequestBody AssistantChatRequest request) {
        if (!assistantService.isConfigured()) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of("configured", false)));
        }
        try {
            String reply = assistantService.chat(request);
            return ResponseEntity.ok(ApiResponse.ok(Map.of("configured", true, "reply", reply)));
        } catch (Exception e) {
            log.warn("Error del asistente IA: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "configured", true,
                    "reply", "Lo siento, no pude procesar tu consulta ahora. Puedes usar los botones del asistente.")));
        }
    }
}
