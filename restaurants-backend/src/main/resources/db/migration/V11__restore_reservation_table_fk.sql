-- Restaura la relación reservations.table_id -> restaurant_tables(id).
-- La tabla restaurant_tables fue redefinida en V10 (se le agregó section_id para S7-01),
-- lo que eliminó la FK original. Se repone para mantener integridad de cara a Etapa 3.
-- (reservations.table_id está sin datos, por eso es seguro.)

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_table_id_fkey;
ALTER TABLE reservations
    ADD CONSTRAINT reservations_table_id_fkey
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;
