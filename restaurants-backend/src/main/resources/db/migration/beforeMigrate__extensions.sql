-- Callback de Flyway: se ejecuta antes de cada "migrate", incluso en BD nuevas.
-- Garantiza las extensiones en entornos donde NO vienen precreadas (Neon, Supabase,
-- RDS...). En Docker la imagen postgis/postgis ya las trae y esto es un no-op.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
