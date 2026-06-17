package com.tingo.restaurants.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateRestaurantRequest {

    @NotBlank(message = "El nombre del restaurante es obligatorio")
    @Size(min = 2, max = 200, message = "El nombre debe tener entre 2 y 200 caracteres")
    private String name;

    @Size(max = 2000, message = "La descripción no puede superar los 2000 caracteres")
    private String description;

    @Pattern(regexp = "^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$",
             message = "Formato de teléfono inválido")
    private String phone;

    @Email(message = "Email inválido")
    private String email;

    private String website;

    @Pattern(regexp = "^[0-9]{11}$", message = "RUC debe tener exactamente 11 dígitos")
    private String ruc;

    @NotBlank(message = "La dirección es obligatoria")
    private String address;

    private String district;

    @NotBlank(message = "La ciudad es obligatoria")
    private String city;

    @NotBlank(message = "La región es obligatoria")
    private String region;

    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    @Min(value = 1, message = "La capacidad mínima es 1")
    @Max(value = 5000, message = "La capacidad máxima es 5000")
    private int totalCapacity;

    @Min(1)
    @Max(4)
    private Integer priceLevel = 2;

    @Min(1) private int minReservationSize = 1;
    @Min(1) private int maxReservationSize = 20;

    private String coverImageUrl;
    private String logoUrl;

    private boolean acceptsReservations = true;
    private boolean acceptsEvents = false;
    private boolean hasParking = false;
    private boolean hasWifi = false;
    private boolean hasAirConditioning = false;
    private boolean isAccessible = false;

    private List<UUID> categoryIds;

    @Valid
    private List<CreateScheduleRequest> schedules;
}
