package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class TableResponse {
    private UUID id;
    private String tableNumber;
    private int capacity;
    private UUID sectionId;
    private String sectionName;
    @JsonProperty("isActive")
    private boolean active;
}
