-- ============================================================
-- V20 — QR de pago del restaurante (Sprint 12)
-- El dueño sube su QR de Yape/Plin; el asistente lo muestra al cliente.
-- ============================================================
ALTER TABLE reservation_config ADD COLUMN payment_qr_url VARCHAR(500);
