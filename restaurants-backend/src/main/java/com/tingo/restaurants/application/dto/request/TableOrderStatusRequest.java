package com.tingo.restaurants.application.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TableOrderStatusRequest {
    /** true = la mesa acaba de registrar un pedido (pasa a OCUPADA); false = liberarla manualmente. */
    private boolean occupied;
}
