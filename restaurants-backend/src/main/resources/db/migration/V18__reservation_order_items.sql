-- ============================================================
-- V18 — Pre-pedido del menú al reservar (Etapa 3, S10-07)
-- El cliente puede elegir platos al reservar; activa el cálculo de adelanto
-- por porcentaje del pedido y sube la prioridad de la reserva.
-- ============================================================
CREATE TABLE reservation_order_items (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    dish_id        UUID NOT NULL,
    dish_name      VARCHAR(200) NOT NULL,
    quantity       INT NOT NULL,
    unit_price     NUMERIC(10,2) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_reservation ON reservation_order_items(reservation_id);
