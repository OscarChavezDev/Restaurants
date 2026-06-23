-- Confirmación de llegada vía QR (S14-02): el dueño escanea el QR de la reserva
-- confirmada y esta pasa a ARRIVED.

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP;
