package com.tingo.restaurants.application.dto.request;

import lombok.Data;

import java.util.List;

/** Petición al asistente con IA. */
@Data
public class AssistantChatRequest {

    /** Código de reserva (opcional) para dar contexto al asistente. */
    private String code;

    /** Historial de la conversación. */
    private List<Msg> messages;

    @Data
    public static class Msg {
        private String role;     // "user" | "assistant"
        private String content;
    }
}
