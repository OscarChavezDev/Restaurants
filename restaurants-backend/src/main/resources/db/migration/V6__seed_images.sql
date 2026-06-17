-- ============================================================
-- V6: Seed images for existing restaurants
-- ============================================================

-- 1. El Encanto de la Selva
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'el-encanto-de-la-selva';

-- 2. El Carbon Resto Bar
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'el-carbon-resto-bar';

-- 3. D'Tinto & Madero
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1574936145840-28808d77a0b6?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'dtinto-y-madero';

-- 4. Etnica Eco-Friendly
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1505826759037-406b40feb4cd?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'etnica-restaurante-eco-friendly';

-- 5. Tirol Bier & Snack
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'tirol-bier-y-snack';

-- 6. Festival Tingo María
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1563514986756-11f26a1dc6e8?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'festival-tingo-maria';

-- 7. Cevichería Lobo Azul
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'cevicheria-lobo-azul';

-- 8. Sabor a Selva
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'sabor-a-selva-tacacheria-pizarro';

-- 9. Puro Aroma Cafetería
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'puro-aroma-cafeteria';

-- 10. Chifa Pollería La Muralla China
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'chifa-polleria-la-muralla-china';

-- 11. La Luciérnaga
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'la-luciernaga';

-- 12. Wira Wira
UPDATE restaurants SET 
  logo_url = 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=200&h=200',
  cover_image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200&h=400'
WHERE slug = 'wira-wira-tingo-maria';

-- Add images to the gallery of the first restaurant as an example
INSERT INTO restaurant_images (restaurant_id, url, caption, display_order)
SELECT id, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200&h=800', 'Ambiente principal', 0
FROM restaurants WHERE slug = 'el-encanto-de-la-selva';

INSERT INTO restaurant_images (restaurant_id, url, caption, display_order)
SELECT id, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1200&h=800', 'Bar del restaurante', 1
FROM restaurants WHERE slug = 'el-encanto-de-la-selva';
