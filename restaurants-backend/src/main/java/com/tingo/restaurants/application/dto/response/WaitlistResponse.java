package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Builder
public class WaitlistResponse {
    private UUID id;
    private UUID restaurantId;
    private String customerName;
    private String customerPhone;
    private LocalDate reservationDate;
    private LocalTime startTime;
    private int partySize;
    private String status;
    private LocalDateTime createdAt;
}
