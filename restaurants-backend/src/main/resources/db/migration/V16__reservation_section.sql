-- ============================================================
-- V16 — Sección elegida por el cliente al reservar (Etapa 3, S9-04)
-- El cliente puede preferir una sección del local (terraza, interior, etc.)
-- si el restaurante tiene secciones definidas (S7-01). Es opcional.
-- ============================================================
ALTER TABLE reservations ADD COLUMN section_id UUID;
