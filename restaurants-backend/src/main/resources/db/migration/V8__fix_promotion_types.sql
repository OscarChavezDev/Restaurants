-- Corrige valores de promo_type sembrados en V3 que no coinciden con el enum
-- PromotionType de la aplicación (PERCENTAGE_DISCOUNT, FIXED_DISCOUNT, COMBO,
-- FREE_ITEM, HAPPY_HOUR). Los valores 'PERCENTAGE' y 'FIXED_AMOUNT' provocaban
-- "No enum constant" (HTTP 500) al cargar cualquier promoción de esos restaurantes.

UPDATE promotions SET promo_type = 'PERCENTAGE_DISCOUNT' WHERE promo_type = 'PERCENTAGE';
UPDATE promotions SET promo_type = 'FIXED_DISCOUNT'      WHERE promo_type = 'FIXED_AMOUNT';
