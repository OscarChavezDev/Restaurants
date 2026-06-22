-- Feriados / días especiales por restaurante (S7-04).
-- Un día especial puede estar cerrado todo el día (is_closed = true) o tener
-- un horario especial (opening_time / closing_time) distinto al horario semanal.

CREATE TABLE restaurant_holidays (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    holiday_date    DATE NOT NULL,
    description     VARCHAR(150),
    is_closed       BOOLEAN NOT NULL DEFAULT TRUE,
    opening_time    TIME,
    closing_time    TIME,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_holiday_per_day UNIQUE (restaurant_id, holiday_date)
);

CREATE INDEX idx_holidays_restaurant ON restaurant_holidays(restaurant_id, holiday_date);
