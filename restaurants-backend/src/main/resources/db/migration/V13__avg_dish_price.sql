-- Precio promedio del menú por restaurante (S8-02). Se recalcula en DishService
-- cada vez que se crea/edita/elimina o cambia disponibilidad de un plato.
-- Sustituye al priceLevel manual (que no estaba bien calculado en Etapa 1).
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS avg_dish_price NUMERIC(10,2);

-- Carga inicial: promedio de platos disponibles por restaurante.
UPDATE restaurants r SET avg_dish_price = (
    SELECT AVG(d.price) FROM dishes d
    WHERE d.restaurant_id = r.id AND d.is_available = TRUE AND d.deleted_at IS NULL
);
