package com.tingo.restaurants.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {
    private boolean available;
    private int requestedPartySize;
    private int occupiedSeats;
    private int totalCapacity;
    private int remainingSeats;
}
