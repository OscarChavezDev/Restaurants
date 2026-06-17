-- Agregar nivel de precio a los restaurantes (1 = $, 2 = $$, 3 = $$$, 4 = $$$$)
ALTER TABLE restaurants
ADD COLUMN price_level INT DEFAULT 2 NOT NULL;
