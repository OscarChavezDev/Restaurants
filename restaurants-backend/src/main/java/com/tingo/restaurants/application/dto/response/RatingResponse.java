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
    private String userName;
    private int score;
    private String comment;
    private Integer foodScore;
    private Integer serviceScore;
    private Integer ambianceScore;
    @JsonProperty("isVerified")
    private boolean isVerified;
    private LocalDateTime createdAt;
}
