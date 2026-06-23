-- Logs de auditoría (S15-03): registro de acciones críticas del sistema
-- (quién canceló una reserva, quién verificó/rechazó un pago, etc.)

CREATE TABLE IF NOT EXISTS audit_logs (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type        VARCHAR(50) NOT NULL,
    entity_id          UUID,
    action             VARCHAR(50) NOT NULL,
    performed_by       UUID,
    performed_by_name  VARCHAR(150),
    performed_at       TIMESTAMP NOT NULL DEFAULT now(),
    detail             TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
