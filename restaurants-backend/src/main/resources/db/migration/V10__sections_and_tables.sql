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

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    section_id      UUID REFERENCES restaurant_sections(id) ON DELETE SET NULL,
    table_number    VARCHAR(20)  NOT NULL,
    capacity        INTEGER      NOT NULL DEFAULT 2,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_table_number_per_restaurant UNIQUE (restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_section ON restaurant_tables(section_id);
