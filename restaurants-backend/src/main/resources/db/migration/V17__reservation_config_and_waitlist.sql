-- ============================================================
-- V17 — Parametrización de reservas (Sprint 10) + lista de espera (Sprint 11)
-- ============================================================

-- Config de reservas: una por restaurante. El dueño define sus reglas.
CREATE TABLE reservation_config (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id               UUID NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
    min_advance_hours           INT NOT NULL DEFAULT 2,
    cancellation_deadline_hours INT NOT NULL DEFAULT 4,
    persons_per_table           INT NOT NULL DEFAULT 4,
    requires_advance_payment    BOOLEAN NOT NULL DEFAULT false,
    small_group_max_persons     INT NOT NULL DEFAULT 6,
    small_group_advance_type    VARCHAR(20) NOT NULL DEFAULT 'CHEAPEST_DISH', -- CHEAPEST_DISH | FIXED_AMOUNT
    small_group_fixed_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    large_group_advance_percent INT NOT NULL DEFAULT 50,
    terms_and_conditions        TEXT,
    allow_section_selection     BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP
);

-- Datos que se calculan/guardan al reservar (Sprint 10/11)
ALTER TABLE reservations ADD COLUMN advance_amount     NUMERIC(10,2);
ALTER TABLE reservations ADD COLUMN terms_accepted     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reservations ADD COLUMN priority           VARCHAR(10) NOT NULL DEFAULT 'NORMAL'; -- NORMAL | HIGH
ALTER TABLE reservations ADD COLUMN reminder_24h_sent  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reservations ADD COLUMN reminder_2h_sent   BOOLEAN NOT NULL DEFAULT false;

-- Lista de espera: si no hay cupo, el cliente se anota (Sprint 11, S11-05)
CREATE TABLE waitlist_entries (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name    VARCHAR(150) NOT NULL,
    customer_email   VARCHAR(255),
    customer_phone   VARCHAR(20),
    reservation_date DATE NOT NULL,
    start_time       TIME,
    party_size       INT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'WAITING', -- WAITING | NOTIFIED | CONVERTED | CANCELLED
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    notified_at      TIMESTAMP
);

CREATE INDEX idx_waitlist_restaurant_date ON waitlist_entries(restaurant_id, reservation_date);
CREATE INDEX idx_reservations_reminders ON reservations(reservation_date, status)
    WHERE deleted_at IS NULL;
