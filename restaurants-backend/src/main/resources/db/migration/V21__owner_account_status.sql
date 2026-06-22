-- Estado de la cuenta para el flujo de solicitud de cuenta de restaurante.
-- ACTIVE: cuenta operativa (todos los usuarios existentes).
-- PENDING_REVIEW: dueño que solicitó cuenta y espera aprobación del admin.
-- REJECTED: solicitud rechazada por el admin.
ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
