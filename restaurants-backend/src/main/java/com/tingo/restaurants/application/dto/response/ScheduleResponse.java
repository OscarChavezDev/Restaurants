package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Builder
public class ScheduleResponse {
    private UUID id;
    private DayOfWeek dayOfWeek;
    private LocalTime openingTime;
    private LocalTime closingTime;
    @JsonProperty("isClosed")
    private boolean isClosed;
}
