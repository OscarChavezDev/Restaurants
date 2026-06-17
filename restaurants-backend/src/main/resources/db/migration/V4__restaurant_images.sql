-- ============================================================
-- TABLA: restaurant_images (galería de fotos)
-- ============================================================

CREATE TABLE restaurant_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    caption         VARCHAR(200),
    display_order   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurant_images_restaurant ON restaurant_images(restaurant_id);
