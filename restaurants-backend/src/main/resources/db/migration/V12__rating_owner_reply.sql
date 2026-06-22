-- Respuesta pública del dueño a una reseña (S7-06).
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS owner_reply    TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS owner_reply_at TIMESTAMP;
