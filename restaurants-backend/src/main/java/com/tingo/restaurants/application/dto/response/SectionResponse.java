package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class SectionResponse {
    private UUID id;
    private String name;
    private String type;
    private int capacity;
    @JsonProperty("isActive")
    private boolean active;
}
