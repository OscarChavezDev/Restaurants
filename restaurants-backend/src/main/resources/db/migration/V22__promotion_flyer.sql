-- Flyer (con copy generado por IA) para mostrar las ofertas en el carrusel
-- de la página principal de restaurantes.
ALTER TABLE promotions ADD COLUMN flyer_headline VARCHAR(120);
ALTER TABLE promotions ADD COLUMN flyer_tagline  VARCHAR(200);
