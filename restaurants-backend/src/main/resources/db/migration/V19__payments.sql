-- ============================================================
-- V19 — Sistema de pago del adelanto (Etapa 3, Sprint 12)
-- ============================================================

-- Estado de pago de la reserva (S12-05)
ALTER TABLE reservations ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED';
-- NOT_REQUIRED | PENDING_PAYMENT | PROOF_SUBMITTED | PAYMENT_VERIFIED

-- Instrucciones de pago del restaurante (cuenta / Yape / Plin) (S12-02)
ALTER TABLE reservation_config ADD COLUMN payment_info TEXT;

-- Comprobantes de pago (S12-03/04)
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    restaurant_id   UUID NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    method          VARCHAR(20) NOT NULL,                  -- YAPE | PLIN | TRANSFERENCIA
    status          VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED | VERIFIED | REJECTED
    proof_image_url VARCHAR(500),
    verified_at     TIMESTAMP,
    verified_by     UUID,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_restaurant ON payments(restaurant_id, status);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
