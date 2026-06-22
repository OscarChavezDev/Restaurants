package com.tingo.restaurants.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateReservationRequest {

    @NotNull(message = "El ID del restaurante es obligatorio")
    private UUID restaurantId;

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(min = 2, max = 150)
    private String customerName;

    @Email(message = "Email inválido")
    private String customerEmail;

    @NotBlank(message = "El teléfono del cliente es obligatorio")
    private String customerPhone;

    @NotNull(message = "La fecha de reserva es obligatoria")
    @FutureOrPresent(message = "La fecha de reserva no puede ser en el pasado")
    private LocalDate reservationDate;

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime startTime;

    private LocalTime endTime;

    @Min(value = 1, message = "El tamaño del grupo debe ser al menos 1")
    @Max(value = 500, message = "El tamaño del grupo no puede superar 500")
    private int partySize;

    /** Sección preferida del local (opcional, S9-04). */
    private UUID sectionId;

    /** El cliente aceptó los términos y condiciones (S10-04). */
    private boolean termsAccepted;

    /** Pre-pedido del menú (opcional, S10-07). */
    @jakarta.validation.Valid
    private java.util.List<OrderItemRequest> orderItems;

    @Size(max = 500)
    private String notes;

    @Size(max = 500)
    private String specialRequests;

    private UUID relatedEventId;
    private String relatedEventName;
}
