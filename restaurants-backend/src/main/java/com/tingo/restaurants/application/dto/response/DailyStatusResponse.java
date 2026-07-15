package com.tingo.restaurants.application.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Estado operativo del día de un restaurante, pensado para que sistemas de
 * itinerarios turísticos decidan si programarlo como parada de almuerzo/cena:
 * horario de hoy, si está abierto ahora mismo, mesas/cupos libres, y el menú
 * con disponibilidad por plato.
 */
@Getter
@Builder
public class DailyStatusResponse {
    private UUID restaurantId;
    private String name;
    private LocalTime openingTime;
    private LocalTime closingTime;
    /** ABIERTO | CERRADO | CERRADO_TEMPORALMENTE */
    private String status;
    private int availableTables;
    private int availableSeats;
    private List<DailyMenuItemResponse> menu;
}
