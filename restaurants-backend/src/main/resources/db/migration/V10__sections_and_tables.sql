-- Secciones del local y mesas (S7-01). Base para la parametrización de reservas en Etapa 3.

CREATE TABLE IF NOT EXISTS restaurant_sections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(20)  NOT NULL DEFAULT 'INTERIOR',  -- INTERIOR | EXTERIOR | TERRAZA | BAR
    capacity        INTEGER      NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sections_restaurant ON restaurant_sections(restaurant_id);

ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES restaurant_sections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tables_section ON restaurant_tables(section_id);
