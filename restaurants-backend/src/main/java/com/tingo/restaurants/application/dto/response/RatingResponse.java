package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RatingResponse {
    private UUID id;
    /** Solo poblado en el historial del cliente (S13-02), donde una reseña puede ser de cualquier restaurante. */
    private UUID restaurantId;
    private String restaurantName;
    private String userName;
    private int score;
    private String comment;
    private Integer foodScore;
    private Integer serviceScore;
    private Integer ambianceScore;
    @JsonProperty("isVerified")
    private boolean isVerified;
    private LocalDateTime createdAt;
    private String ownerReply;
    private LocalDateTime ownerReplyAt;
}
