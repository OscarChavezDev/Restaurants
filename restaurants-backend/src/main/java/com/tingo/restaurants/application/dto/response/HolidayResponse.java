package com.tingo.restaurants.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Builder
public class HolidayResponse {
    private UUID id;
    private LocalDate holidayDate;
    private String description;
    @JsonProperty("isClosed")
    private boolean closed;
    private LocalTime openingTime;
    private LocalTime closingTime;
}
