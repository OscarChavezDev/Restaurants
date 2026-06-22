-- ============================================================
-- V15 — Soporte de inicio de sesión con Google (OAuth) para el rol CLIENTE
-- El cliente se registra/ingresa únicamente con Google (Etapa 3, S9-01).
-- Los usuarios LOCAL (ADMIN / RESTAURANTE_OWNER) siguen con email + contraseña.
-- ============================================================

-- Proveedor de identidad: LOCAL (email+password) o GOOGLE
ALTER TABLE users ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';

-- "sub" estable que entrega Google en el ID token (identifica al usuario)
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);

-- Los usuarios de Google no tienen contraseña local
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Un mismo Google account no puede tener dos cuentas activas
CREATE UNIQUE INDEX ux_users_google_id
    ON users (google_id)
    WHERE google_id IS NOT NULL AND deleted_at IS NULL;
