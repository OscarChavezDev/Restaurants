-- ============================================================
-- V3: Restaurantes reales de Tingo María, Huánuco, Perú
-- Fuentes: TripAdvisor, Google Maps, directorios locales
-- Coordenadas base Plaza de Armas: -9.2965, -75.9970
-- Contraseña de todos los owners (dev): Admin@1234!
-- ============================================================

DO $$
DECLARE
  -- UUIDs para dueños
  uid_owner_encanto    UUID := uuid_generate_v4();
  uid_owner_carbon     UUID := uuid_generate_v4();
  uid_owner_dtinto     UUID := uuid_generate_v4();
  uid_owner_etnica     UUID := uuid_generate_v4();
  uid_owner_tirol      UUID := uuid_generate_v4();
  uid_owner_festival   UUID := uuid_generate_v4();
  uid_owner_lobo       UUID := uuid_generate_v4();
  uid_owner_sabor      UUID := uuid_generate_v4();
  uid_owner_puro       UUID := uuid_generate_v4();
  uid_owner_muralla    UUID := uuid_generate_v4();
  uid_owner_luciernaga UUID := uuid_generate_v4();
  uid_owner_wirawira   UUID := uuid_generate_v4();

  -- UUIDs para restaurantes
  uid_encanto    UUID := uuid_generate_v4();
  uid_carbon     UUID := uuid_generate_v4();
  uid_dtinto     UUID := uuid_generate_v4();
  uid_etnica     UUID := uuid_generate_v4();
  uid_tirol      UUID := uuid_generate_v4();
  uid_festival   UUID := uuid_generate_v4();
  uid_lobo       UUID := uuid_generate_v4();
  uid_sabor      UUID := uuid_generate_v4();
  uid_puro       UUID := uuid_generate_v4();
  uid_muralla    UUID := uuid_generate_v4();
  uid_luciernaga UUID := uuid_generate_v4();
  uid_wirawira   UUID := uuid_generate_v4();

  -- UUIDs para menús
  uid_menu_encanto    UUID := uuid_generate_v4();
  uid_menu_carbon     UUID := uuid_generate_v4();
  uid_menu_dtinto     UUID := uuid_generate_v4();
  uid_menu_etnica     UUID := uuid_generate_v4();
  uid_menu_tirol      UUID := uuid_generate_v4();
  uid_menu_festival   UUID := uuid_generate_v4();
  uid_menu_lobo       UUID := uuid_generate_v4();
  uid_menu_sabor      UUID := uuid_generate_v4();
  uid_menu_puro       UUID := uuid_generate_v4();
  uid_menu_muralla    UUID := uuid_generate_v4();
  uid_menu_luciernaga UUID := uuid_generate_v4();
  uid_menu_wirawira   UUID := uuid_generate_v4();

  -- IDs de categorías de comida (insertadas en V2)
  cat_peruana     UUID;
  cat_mariscos    UUID;
  cat_parrillas   UUID;
  cat_selvatica   UUID;
  cat_vegetariana UUID;
  cat_italiana    UUID;
  cat_pollos      UUID;
  cat_cafeteria   UUID;

  -- Hash bcrypt de 'Admin@1234!' para entorno de desarrollo
  pwd_hash CONSTANT VARCHAR := '$2a$12$Vl2VwOkP9h0HwMzVE1eHx.6M/P.rdZvLXZLDPlv84SR3lYgiW8A/2';

BEGIN

  -- Obtener IDs de categorías de comida
  SELECT id INTO cat_peruana     FROM food_categories WHERE name = 'Comida Peruana';
  SELECT id INTO cat_mariscos    FROM food_categories WHERE name = 'Mariscos';
  SELECT id INTO cat_parrillas   FROM food_categories WHERE name = 'Parrillas';
  SELECT id INTO cat_selvatica   FROM food_categories WHERE name = 'Comida Selvática';
  SELECT id INTO cat_vegetariana FROM food_categories WHERE name = 'Vegetariana';
  SELECT id INTO cat_italiana    FROM food_categories WHERE name = 'Pizzas y Pastas';
  SELECT id INTO cat_pollos      FROM food_categories WHERE name = 'Pollos y Frituras';
  SELECT id INTO cat_cafeteria   FROM food_categories WHERE name = 'Cafetería';

  -- ============================================================
  -- USUARIOS DUEÑOS DE RESTAURANTES
  -- ============================================================
  INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
    (uid_owner_encanto,    'owner.encanto@tingomaria.com',    pwd_hash, 'Propietario El Encanto de la Selva',   '+51975175122', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_carbon,     'owner.carbon@tingomaria.com',     pwd_hash, 'Oscar Huamán - El Carbon Resto Bar',   '+51995080872', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_dtinto,     'owner.dtinto@tingomaria.com',     pwd_hash, 'Propietario D''Tinto y Madero',        NULL,           'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_etnica,     'owner.etnica@tingomaria.com',     pwd_hash, 'Propietario Etnica Eco-Friendly',      '+51918762580', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_tirol,      'owner.tirol@tingomaria.com',      pwd_hash, 'Propietario Tirol Bier y Snack',       '+51998101966', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_festival,   'owner.festival@tingomaria.com',   pwd_hash, 'Propietario Festival Tingo María',    '+51961575097', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_lobo,       'owner.lobo@tingomaria.com',       pwd_hash, 'Propietario Cevichería Lobo Azul',     '+51969740787', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_sabor,      'owner.sabor@tingomaria.com',      pwd_hash, 'Propietario Sabor a Selva',            '+51946771109', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_puro,       'owner.puro@tingomaria.com',       pwd_hash, 'Iván Zúñiga Martínez - Puro Aroma',  '+51625625820', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_muralla,    'owner.muralla@tingomaria.com',    pwd_hash, 'Propietario La Muralla China',         '+51914020599', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_luciernaga, 'owner.luciernaga@tingomaria.com', pwd_hash, 'Propietario La Luciérnaga',           '+51960772428', 'RESTAURANTE_OWNER', TRUE, TRUE),
    (uid_owner_wirawira,   'owner.wirawira@tingomaria.com',   pwd_hash, 'Propietario Wira Wira Tingo María',  '+51942945791', 'RESTAURANTE_OWNER', TRUE, TRUE);

  -- ============================================================
  -- RESTAURANTES
  -- ============================================================
  INSERT INTO restaurants (
    id, owner_id, name, slug, description, phone, email, ruc, status,
    address, district, city, region,
    latitude, longitude, geolocation,
    total_capacity, min_reservation_size, max_reservation_size,
    avg_rating, total_ratings,
    accepts_reservations, accepts_events,
    has_parking, has_wifi, has_air_conditioning, is_accessible
  ) VALUES

  -- 1. El Encanto de la Selva | #1 TripAdvisor Tingo María | 4.0★ (50 reseñas)
  (uid_encanto, uid_owner_encanto,
   'El Encanto de la Selva', 'el-encanto-de-la-selva',
   'El restaurante más emblemático de Tingo María. Referencia obligada para la gastronomía amazónica auténtica: tacacho con cecina, juane de gallina y ceviches de pescado de río. Más de dos décadas sirviendo la mejor comida selvática de la región.',
   '+51975175122', NULL, NULL, 'ACTIVE',
   'Av. Alameda Perú 280', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29600, -75.99700,
   ST_SetSRID(ST_MakePoint(-75.99700, -9.29600), 4326),
   80, 2, 20, 4.0, 50,
   TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),

  -- 2. El Carbon Resto Bar | #3 TripAdvisor | 4.8★ (4 reseñas)
  (uid_carbon, uid_owner_carbon,
   'El Carbon Resto Bar', 'el-carbon-resto-bar',
   'Restobar con vista al río Huallaga especializado en parrillas y gastronomía criolla-amazónica. El mejor lomo fino a la parrilla y combos regionales de la ciudad. Atiende eventos corporativos y sociales con delivery gratuito.',
   '+51062289525', 'elcarbonrestobartm@gmail.com', NULL, 'ACTIVE',
   'Av. Antonio Raimondi 435', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29700, -75.99850,
   ST_SetSRID(ST_MakePoint(-75.99850, -9.29700), 4326),
   100, 2, 30, 4.8, 4,
   TRUE, TRUE, FALSE, FALSE, TRUE, FALSE),

  -- 3. D'Tinto & Madero | #2 TripAdvisor | 3.8★ (32 reseñas)
  (uid_dtinto, uid_owner_dtinto,
   'D''Tinto & Madero', 'dtinto-y-madero',
   'Restaurante de ambiente romántico y sofisticado en el corazón de Tingo María. Especializado en cortes de carne importados, pescados al vapor y cócteles selváticos. El segundo local más reseñado de la ciudad.',
   NULL, NULL, NULL, 'ACTIVE',
   'Jr. J. Pratto 490', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29650, -75.99750,
   ST_SetSRID(ST_MakePoint(-75.99750, -9.29650), 4326),
   60, 2, 15, 3.8, 32,
   TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),

  -- 4. Etnica Restaurante Eco-Friendly | #5 TripAdvisor | 5.0★ (2 reseñas)
  (uid_etnica, uid_owner_etnica,
   'Etnica Restaurante Eco-Friendly', 'etnica-restaurante-eco-friendly',
   'Restaurante eco-sostenible con terraza y vista privilegiada al río Huallaga. Cocina de autor que fusiona sabores amazónicos con técnicas italianas. Acepta múltiples medios de pago y ofrece eventos con enfoque ecológico.',
   '+51918762580', 'etnicarestaurante@gmail.com', NULL, 'ACTIVE',
   'Av. Raymondi 341 Int-D', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29720, -75.99880,
   ST_SetSRID(ST_MakePoint(-75.99880, -9.29720), 4326),
   70, 2, 20, 5.0, 2,
   TRUE, TRUE, TRUE, FALSE, TRUE, TRUE),

  -- 5. Tirol Bier & Snack | #6 TripAdvisor | 4.7★ (3 reseñas)
  (uid_tirol, uid_owner_tirol,
   'Tirol Bier & Snack', 'tirol-bier-y-snack',
   'El único brew pub de Tingo María. Cervezas artesanales Dörcher y parrillas mixtas. Áreas exteriores, TV y juegos. Punto de encuentro nocturno de la ciudad, al costado de la piscina Falcón.',
   '+51998101966', 'tirolbiertingomaria@gmail.com', NULL, 'ACTIVE',
   'Av. Ucayali 681', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.30050, -75.99600,
   ST_SetSRID(ST_MakePoint(-75.99600, -9.30050), 4326),
   80, 2, 20, 4.7, 3,
   TRUE, TRUE, TRUE, FALSE, FALSE, TRUE),

  -- 6. Festival Tingo María | #4 TripAdvisor | 4.5★ (4 reseñas)
  (uid_festival, uid_owner_festival,
   'Festival Tingo María', 'festival-tingo-maria',
   'El mejor patio gastronómico de toda la región. Más de 7 opciones gastronómicas: makis, fusión amazónica y cervezas artesanales. Pet-friendly, apto para familias, al aire libre. Solo jueves a domingo desde las 6 PM.',
   '+51961575097', NULL, NULL, 'ACTIVE',
   'Av. José Carlos Mariátegui 440', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.30100, -76.00200,
   ST_SetSRID(ST_MakePoint(-76.00200, -9.30100), 4326),
   120, 2, 40, 4.5, 4,
   TRUE, TRUE, FALSE, FALSE, FALSE, FALSE),

  -- 7. Cevichería Lobo Azul | 4.2★ (25 reseñas Google Maps)
  (uid_lobo, uid_owner_lobo,
   'Cevichería Lobo Azul', 'cevicheria-lobo-azul',
   'La mejor cevichería de Tingo María. Reconocida por sus ceviches de dorado y doncella, pescado de río fresco. Recetas familiares tradicionales con la auténtica leche de tigre amazónica. Cierra los martes.',
   '+51969740787', NULL, NULL, 'ACTIVE',
   'Av. Antonio Raymondi 641', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29580, -75.99900,
   ST_SetSRID(ST_MakePoint(-75.99900, -9.29580), 4326),
   60, 2, 15, 4.2, 25,
   FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),

  -- 8. Sabor a Selva - Tacachería Pizarro | 4.3★ (46 reseñas)
  (uid_sabor, uid_owner_sabor,
   'Sabor a Selva - Tacachería Pizarro', 'sabor-a-selva-tacacheria-pizarro',
   'La tacachería más reconocida de Tingo María. Auténtico tacacho con cecina y chorizo amazónico, juane de gallina, patarashca de paiche e inchicapi. Precios accesibles para todo tipo de economía. Delivery disponible.',
   '+51946771109', NULL, NULL, 'ACTIVE',
   'Av. Tito Jaime Fernández 137', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29850, -75.99600,
   ST_SetSRID(ST_MakePoint(-75.99600, -9.29850), 4326),
   50, 2, 15, 4.3, 46,
   FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),

  -- 9. Puro Aroma Cafetería | 4.6★ (639 reseñas carta.menu) | Fundada 2012
  (uid_puro, uid_owner_puro,
   'Puro Aroma Cafetería', 'puro-aroma-cafeteria',
   'Cafetería especializada en café arábica de altura de Tingo María, fundada en 2012 por los esposos Zúñiga Coronel. Café de especialidad, jugos tropicales y desayunos en ambiente acogedor. WiFi gratuito y estacionamiento.',
   '+51625625820', 'ivanzunigamartinez@hotmail.com', NULL, 'ACTIVE',
   'Jr. Ucayali 350', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29680, -75.99750,
   ST_SetSRID(ST_MakePoint(-75.99750, -9.29680), 4326),
   35, 1, 8, 4.6, 30,
   FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),

  -- 10. Chifa Pollería La Muralla China | RUC: 20529157241 | 2.9★ (10 reseñas)
  (uid_muralla, uid_owner_muralla,
   'Chifa Pollería La Muralla China', 'chifa-polleria-la-muralla-china',
   'La única chifa de Tingo María que combina cocina chino-peruana con pollería. Permite combinar platos: chaufa con pollo a la brasa, wontons con arroz. Abierto desde las 6 AM todos los días.',
   '+51914020599', NULL, '20529157241', 'ACTIVE',
   'Jr. Aguaytia 437', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29700, -75.99920,
   ST_SetSRID(ST_MakePoint(-75.99920, -9.29700), 4326),
   50, 2, 15, 2.9, 10,
   FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),

  -- 11. La Luciérnaga | 5.0★ | WiFi + Estacionamiento + Accesible
  (uid_luciernaga, uid_owner_luciernaga,
   'La Luciérnaga', 'la-luciernaga',
   'Restaurante familiar especializado en caldo de gallina de chacra, el único en Tingo María que lo prepara con arroz o fideos al gusto. Ambiente acogedor, accesible para personas con discapacidad, WiFi y estacionamiento.',
   '+51960772428', NULL, NULL, 'ACTIVE',
   'Av. Tito Jaime 910', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29900, -75.99550,
   ST_SetSRID(ST_MakePoint(-75.99550, -9.29900), 4326),
   45, 1, 12, 5.0, 1,
   FALSE, FALSE, TRUE, TRUE, FALSE, TRUE),

  -- 12. Wira Wira Tingo María | 5.0★ | A una cuadra de la Plaza de Armas
  (uid_wirawira, uid_owner_wirawira,
   'Wira Wira Tingo María', 'wira-wira-tingo-maria',
   'A una cuadra de la Plaza de Armas, famoso por su Chaufa Wira Wira con cecina, chorizo y chicharrón acompañado de maduro frito. Fusión criolla-amazónica única. Cierra los miércoles.',
   '+51942945791', 'wirawiratm@gmail.com', NULL, 'ACTIVE',
   'Jr. Chiclayo 381', 'Rupa Rupa', 'Tingo María', 'Huánuco',
   -9.29620, -75.99680,
   ST_SetSRID(ST_MakePoint(-75.99680, -9.29620), 4326),
   40, 1, 10, 5.0, 1,
   FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

  -- ============================================================
  -- CATEGORÍAS DE COMIDA POR RESTAURANTE
  -- ============================================================
  INSERT INTO restaurant_food_categories (restaurant_id, category_id) VALUES
    (uid_encanto,    cat_selvatica),
    (uid_encanto,    cat_peruana),
    (uid_carbon,     cat_parrillas),
    (uid_carbon,     cat_peruana),
    (uid_dtinto,     cat_parrillas),
    (uid_dtinto,     cat_peruana),
    (uid_etnica,     cat_italiana),
    (uid_etnica,     cat_peruana),
    (uid_etnica,     cat_vegetariana),
    (uid_tirol,      cat_parrillas),
    (uid_festival,   cat_peruana),
    (uid_festival,   cat_mariscos),
    (uid_lobo,       cat_mariscos),
    (uid_lobo,       cat_peruana),
    (uid_sabor,      cat_selvatica),
    (uid_sabor,      cat_peruana),
    (uid_puro,       cat_cafeteria),
    (uid_muralla,    cat_pollos),
    (uid_muralla,    cat_peruana),
    (uid_luciernaga, cat_peruana),
    (uid_luciernaga, cat_selvatica),
    (uid_wirawira,   cat_selvatica),
    (uid_wirawira,   cat_peruana);

  -- ============================================================
  -- MESAS POR RESTAURANTE
  -- ============================================================

  -- El Encanto de la Selva (80 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_encanto, 'M01', 4, 'AVAILABLE', 'Salón principal'), (uid_encanto, 'M02', 4, 'AVAILABLE', 'Salón principal'),
    (uid_encanto, 'M03', 4, 'AVAILABLE', 'Salón principal'), (uid_encanto, 'M04', 6, 'AVAILABLE', 'Salón principal'),
    (uid_encanto, 'M05', 6, 'AVAILABLE', 'Salón principal'), (uid_encanto, 'M06', 8, 'AVAILABLE', 'Salón familiar'),
    (uid_encanto, 'M07', 8, 'AVAILABLE', 'Salón familiar'), (uid_encanto, 'T01', 4, 'AVAILABLE', 'Terraza exterior'),
    (uid_encanto, 'T02', 4, 'AVAILABLE', 'Terraza exterior'), (uid_encanto, 'T03', 6, 'AVAILABLE', 'Terraza exterior');

  -- El Carbon Resto Bar (100 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_carbon, 'M01', 4, 'AVAILABLE', 'Salón interior'), (uid_carbon, 'M02', 4, 'AVAILABLE', 'Salón interior'),
    (uid_carbon, 'M03', 6, 'AVAILABLE', 'Salón interior'), (uid_carbon, 'M04', 6, 'AVAILABLE', 'Salón interior'),
    (uid_carbon, 'M05', 8, 'AVAILABLE', 'Salón VIP'),      (uid_carbon, 'M06', 8, 'AVAILABLE', 'Salón VIP'),
    (uid_carbon, 'T01', 4, 'AVAILABLE', 'Vista al río'),   (uid_carbon, 'T02', 4, 'AVAILABLE', 'Vista al río'),
    (uid_carbon, 'T03', 6, 'AVAILABLE', 'Vista al río'),   (uid_carbon, 'T04', 6, 'AVAILABLE', 'Vista al río'),
    (uid_carbon, 'E01', 20, 'AVAILABLE', 'Salón eventos'), (uid_carbon, 'E02', 14, 'AVAILABLE', 'Salón eventos');

  -- D'Tinto & Madero (60 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_dtinto, 'M01', 2, 'AVAILABLE', 'Salón romántico'), (uid_dtinto, 'M02', 2, 'AVAILABLE', 'Salón romántico'),
    (uid_dtinto, 'M03', 4, 'AVAILABLE', 'Salón principal'), (uid_dtinto, 'M04', 4, 'AVAILABLE', 'Salón principal'),
    (uid_dtinto, 'M05', 6, 'AVAILABLE', 'Salón principal'), (uid_dtinto, 'M06', 8, 'AVAILABLE', 'Salón grupal'),
    (uid_dtinto, 'M07', 8, 'AVAILABLE', 'Salón grupal');

  -- Etnica Eco-Friendly (70 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_etnica, 'M01', 4, 'AVAILABLE', 'Interior'),       (uid_etnica, 'M02', 4, 'AVAILABLE', 'Interior'),
    (uid_etnica, 'T01', 4, 'AVAILABLE', 'Terraza río'),    (uid_etnica, 'T02', 4, 'AVAILABLE', 'Terraza río'),
    (uid_etnica, 'T03', 6, 'AVAILABLE', 'Terraza río'),    (uid_etnica, 'T04', 6, 'AVAILABLE', 'Terraza río'),
    (uid_etnica, 'E01', 20, 'AVAILABLE', 'Sala eventos'),  (uid_etnica, 'E02', 16, 'AVAILABLE', 'Sala eventos');

  -- Tirol Bier & Snack (80 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_tirol, 'M01', 4, 'AVAILABLE', 'Interior'),         (uid_tirol, 'M02', 4, 'AVAILABLE', 'Interior'),
    (uid_tirol, 'M03', 4, 'AVAILABLE', 'Interior'),         (uid_tirol, 'T01', 6, 'AVAILABLE', 'Área exterior'),
    (uid_tirol, 'T02', 6, 'AVAILABLE', 'Área exterior'),   (uid_tirol, 'T03', 6, 'AVAILABLE', 'Área exterior'),
    (uid_tirol, 'B01', 4, 'AVAILABLE', 'Barra'),            (uid_tirol, 'B02', 4, 'AVAILABLE', 'Barra');

  -- Festival Tingo María (120 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_festival, 'P01', 6,  'AVAILABLE', 'Patio gastronómico'), (uid_festival, 'P02', 6,  'AVAILABLE', 'Patio gastronómico'),
    (uid_festival, 'P03', 6,  'AVAILABLE', 'Patio gastronómico'), (uid_festival, 'P04', 8,  'AVAILABLE', 'Patio gastronómico'),
    (uid_festival, 'P05', 8,  'AVAILABLE', 'Área familiar'),      (uid_festival, 'P06', 8,  'AVAILABLE', 'Área familiar'),
    (uid_festival, 'P07', 10, 'AVAILABLE', 'Área familiar'),      (uid_festival, 'E01', 30, 'AVAILABLE', 'Área eventos'),
    (uid_festival, 'E02', 30, 'AVAILABLE', 'Área eventos');

  -- Cevichería Lobo Azul (60 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_lobo, 'M01', 4, 'AVAILABLE', 'Salón'), (uid_lobo, 'M02', 4, 'AVAILABLE', 'Salón'),
    (uid_lobo, 'M03', 6, 'AVAILABLE', 'Salón'), (uid_lobo, 'M04', 6, 'AVAILABLE', 'Salón'),
    (uid_lobo, 'M05', 6, 'AVAILABLE', 'Salón'), (uid_lobo, 'T01', 4, 'AVAILABLE', 'Terraza'),
    (uid_lobo, 'T02', 4, 'AVAILABLE', 'Terraza');

  -- Sabor a Selva (50 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_sabor, 'M01', 4, 'AVAILABLE', 'Salón'), (uid_sabor, 'M02', 4, 'AVAILABLE', 'Salón'),
    (uid_sabor, 'M03', 4, 'AVAILABLE', 'Salón'), (uid_sabor, 'M04', 6, 'AVAILABLE', 'Salón'),
    (uid_sabor, 'M05', 6, 'AVAILABLE', 'Salón'), (uid_sabor, 'M06', 8, 'AVAILABLE', 'Salón grupal');

  -- Puro Aroma Cafetería (35 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_puro, 'M01', 2, 'AVAILABLE', 'Interior'), (uid_puro, 'M02', 2, 'AVAILABLE', 'Interior'),
    (uid_puro, 'M03', 4, 'AVAILABLE', 'Interior'), (uid_puro, 'M04', 4, 'AVAILABLE', 'Interior'),
    (uid_puro, 'M05', 4, 'AVAILABLE', 'Interior'), (uid_puro, 'T01', 4, 'AVAILABLE', 'Exterior'),
    (uid_puro, 'T02', 3, 'AVAILABLE', 'Exterior');

  -- La Muralla China (50 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_muralla, 'M01', 4, 'AVAILABLE', 'Salón'), (uid_muralla, 'M02', 4, 'AVAILABLE', 'Salón'),
    (uid_muralla, 'M03', 4, 'AVAILABLE', 'Salón'), (uid_muralla, 'M04', 6, 'AVAILABLE', 'Salón'),
    (uid_muralla, 'M05', 6, 'AVAILABLE', 'Salón'), (uid_muralla, 'M06', 8, 'AVAILABLE', 'Salón familiar');

  -- La Luciérnaga (45 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_luciernaga, 'M01', 4, 'AVAILABLE', 'Salón'), (uid_luciernaga, 'M02', 4, 'AVAILABLE', 'Salón'),
    (uid_luciernaga, 'M03', 4, 'AVAILABLE', 'Salón'), (uid_luciernaga, 'M04', 6, 'AVAILABLE', 'Salón'),
    (uid_luciernaga, 'T01', 4, 'AVAILABLE', 'Exterior'), (uid_luciernaga, 'T02', 4, 'AVAILABLE', 'Exterior');

  -- Wira Wira (40 cap)
  INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, location_desc) VALUES
    (uid_wirawira, 'M01', 4, 'AVAILABLE', 'Salón'), (uid_wirawira, 'M02', 4, 'AVAILABLE', 'Salón'),
    (uid_wirawira, 'M03', 4, 'AVAILABLE', 'Salón'), (uid_wirawira, 'M04', 6, 'AVAILABLE', 'Salón'),
    (uid_wirawira, 'M05', 6, 'AVAILABLE', 'Salón'), (uid_wirawira, 'T01', 4, 'AVAILABLE', 'Exterior');

  -- ============================================================
  -- HORARIOS DE APERTURA
  -- Valores: MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY SUNDAY
  -- ============================================================

  -- 1. El Encanto de la Selva: L-D 6:00-23:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_encanto, 'MONDAY',    '06:00', '23:00', FALSE), (uid_encanto, 'TUESDAY',   '06:00', '23:00', FALSE),
    (uid_encanto, 'WEDNESDAY', '06:00', '23:00', FALSE), (uid_encanto, 'THURSDAY',  '06:00', '23:00', FALSE),
    (uid_encanto, 'FRIDAY',    '06:00', '23:00', FALSE), (uid_encanto, 'SATURDAY',  '06:00', '23:00', FALSE),
    (uid_encanto, 'SUNDAY',    '06:00', '23:00', FALSE);

  -- 2. El Carbon Resto Bar: L-D 11:30-23:59
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_carbon, 'MONDAY',    '11:30', '23:59', FALSE), (uid_carbon, 'TUESDAY',   '11:30', '23:59', FALSE),
    (uid_carbon, 'WEDNESDAY', '11:30', '23:59', FALSE), (uid_carbon, 'THURSDAY',  '11:30', '23:59', FALSE),
    (uid_carbon, 'FRIDAY',    '11:30', '23:59', FALSE), (uid_carbon, 'SATURDAY',  '11:30', '23:59', FALSE),
    (uid_carbon, 'SUNDAY',    '11:30', '23:59', FALSE);

  -- 3. D'Tinto & Madero: L-D 12:00-23:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_dtinto, 'MONDAY',    '12:00', '23:00', FALSE), (uid_dtinto, 'TUESDAY',   '12:00', '23:00', FALSE),
    (uid_dtinto, 'WEDNESDAY', '12:00', '23:00', FALSE), (uid_dtinto, 'THURSDAY',  '12:00', '23:00', FALSE),
    (uid_dtinto, 'FRIDAY',    '12:00', '23:00', FALSE), (uid_dtinto, 'SATURDAY',  '12:00', '23:00', FALSE),
    (uid_dtinto, 'SUNDAY',    '12:00', '23:00', FALSE);

  -- 4. Etnica Eco-Friendly: L-D 12:00-23:59
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_etnica, 'MONDAY',    '12:00', '23:59', FALSE), (uid_etnica, 'TUESDAY',   '12:00', '23:59', FALSE),
    (uid_etnica, 'WEDNESDAY', '12:00', '23:59', FALSE), (uid_etnica, 'THURSDAY',  '12:00', '23:59', FALSE),
    (uid_etnica, 'FRIDAY',    '12:00', '23:59', FALSE), (uid_etnica, 'SATURDAY',  '12:00', '23:59', FALSE),
    (uid_etnica, 'SUNDAY',    '12:00', '23:59', FALSE);

  -- 5. Tirol Bier: Lu CERRADO | Ma-Ju 17-23:45 | Vi-Sa 17-23:59 | Do 17-23:45
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_tirol, 'MONDAY',    '17:00', '23:45', TRUE),
    (uid_tirol, 'TUESDAY',   '17:00', '23:45', FALSE), (uid_tirol, 'WEDNESDAY', '17:00', '23:45', FALSE),
    (uid_tirol, 'THURSDAY',  '17:00', '23:45', FALSE), (uid_tirol, 'FRIDAY',    '17:00', '23:59', FALSE),
    (uid_tirol, 'SATURDAY',  '17:00', '23:59', FALSE), (uid_tirol, 'SUNDAY',    '17:00', '23:45', FALSE);

  -- 6. Festival Tingo María: Lu-Mi CERRADO | Ju-Do 18:00-23:59
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_festival, 'MONDAY',    '18:00', '23:59', TRUE),
    (uid_festival, 'TUESDAY',   '18:00', '23:59', TRUE),
    (uid_festival, 'WEDNESDAY', '18:00', '23:59', TRUE),
    (uid_festival, 'THURSDAY',  '18:00', '23:59', FALSE), (uid_festival, 'FRIDAY',   '18:00', '23:59', FALSE),
    (uid_festival, 'SATURDAY',  '18:00', '23:59', FALSE), (uid_festival, 'SUNDAY',   '18:00', '23:59', FALSE);

  -- 7. Lobo Azul: Ma CERRADO | resto 9:30-16:30
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_lobo, 'MONDAY',    '09:30', '16:30', FALSE),
    (uid_lobo, 'TUESDAY',   '09:30', '16:30', TRUE),
    (uid_lobo, 'WEDNESDAY', '09:30', '16:30', FALSE), (uid_lobo, 'THURSDAY',  '09:30', '16:30', FALSE),
    (uid_lobo, 'FRIDAY',    '09:30', '16:30', FALSE), (uid_lobo, 'SATURDAY',  '09:30', '16:30', FALSE),
    (uid_lobo, 'SUNDAY',    '09:30', '16:30', FALSE);

  -- 8. Sabor a Selva: L-D 9:00-22:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_sabor, 'MONDAY',    '09:00', '22:00', FALSE), (uid_sabor, 'TUESDAY',   '09:00', '22:00', FALSE),
    (uid_sabor, 'WEDNESDAY', '09:00', '22:00', FALSE), (uid_sabor, 'THURSDAY',  '09:00', '22:00', FALSE),
    (uid_sabor, 'FRIDAY',    '09:00', '22:00', FALSE), (uid_sabor, 'SATURDAY',  '09:00', '22:00', FALSE),
    (uid_sabor, 'SUNDAY',    '09:00', '22:00', FALSE);

  -- 9. Puro Aroma Cafetería: L-D 7:00-20:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_puro, 'MONDAY',    '07:00', '20:00', FALSE), (uid_puro, 'TUESDAY',   '07:00', '20:00', FALSE),
    (uid_puro, 'WEDNESDAY', '07:00', '20:00', FALSE), (uid_puro, 'THURSDAY',  '07:00', '20:00', FALSE),
    (uid_puro, 'FRIDAY',    '07:00', '20:00', FALSE), (uid_puro, 'SATURDAY',  '07:00', '20:00', FALSE),
    (uid_puro, 'SUNDAY',    '07:00', '20:00', FALSE);

  -- 10. La Muralla China: L-D 6:00-22:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_muralla, 'MONDAY',    '06:00', '22:00', FALSE), (uid_muralla, 'TUESDAY',   '06:00', '22:00', FALSE),
    (uid_muralla, 'WEDNESDAY', '06:00', '22:00', FALSE), (uid_muralla, 'THURSDAY',  '06:00', '22:00', FALSE),
    (uid_muralla, 'FRIDAY',    '06:00', '22:00', FALSE), (uid_muralla, 'SATURDAY',  '06:00', '22:00', FALSE),
    (uid_muralla, 'SUNDAY',    '06:00', '22:00', FALSE);

  -- 11. La Luciérnaga: L-Sa 6:00-22:00 | Do 5:00-21:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_luciernaga, 'MONDAY',    '06:00', '22:00', FALSE), (uid_luciernaga, 'TUESDAY',   '06:00', '22:00', FALSE),
    (uid_luciernaga, 'WEDNESDAY', '06:00', '22:00', FALSE), (uid_luciernaga, 'THURSDAY',  '06:00', '22:00', FALSE),
    (uid_luciernaga, 'FRIDAY',    '06:00', '22:00', FALSE), (uid_luciernaga, 'SATURDAY',  '06:00', '22:00', FALSE),
    (uid_luciernaga, 'SUNDAY',    '05:00', '21:00', FALSE);

  -- 12. Wira Wira: Mi CERRADO | resto 8:00-16:00
  INSERT INTO schedules (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
    (uid_wirawira, 'MONDAY',    '08:00', '16:00', FALSE), (uid_wirawira, 'TUESDAY',   '08:00', '16:00', FALSE),
    (uid_wirawira, 'WEDNESDAY', '08:00', '16:00', TRUE),
    (uid_wirawira, 'THURSDAY',  '08:00', '16:00', FALSE), (uid_wirawira, 'FRIDAY',    '08:00', '16:00', FALSE),
    (uid_wirawira, 'SATURDAY',  '08:00', '16:00', FALSE), (uid_wirawira, 'SUNDAY',    '08:00', '16:00', FALSE);

  -- ============================================================
  -- MENÚS
  -- ============================================================
  INSERT INTO menus (id, restaurant_id, name, description, is_active) VALUES
    (uid_menu_encanto,    uid_encanto,    'Carta Principal',                 'Gastronomía amazónica auténtica de Tingo María',               TRUE),
    (uid_menu_carbon,     uid_carbon,     'Carta El Carbon',                 'Parrillas, criolla y cocina amazónica vista al río',           TRUE),
    (uid_menu_dtinto,     uid_dtinto,     'Carta D''Tinto & Madero',         'Cortes de carne, pescados y cócteles selváticos',             TRUE),
    (uid_menu_etnica,     uid_etnica,     'Menú Etnica Eco',                 'Cocina de autor eco-sostenible con ingredientes locales',      TRUE),
    (uid_menu_tirol,      uid_tirol,      'Carta Tirol',                     'Parrillas, snacks y cervezas artesanales Dörcher',            TRUE),
    (uid_menu_festival,   uid_festival,   'Carta Festival',                  'Makis, fusión amazónica y cervezas artesanales',               TRUE),
    (uid_menu_lobo,       uid_lobo,       'Carta Lobo Azul',                 'Ceviches, pescados y mariscos frescos del río y mar',          TRUE),
    (uid_menu_sabor,      uid_sabor,      'Carta Sabor a Selva',             'Especialidades amazónicas a precios accesibles',               TRUE),
    (uid_menu_puro,       uid_puro,       'Carta Puro Aroma',                'Café de especialidad, jugos y desayunos tropicales',           TRUE),
    (uid_menu_muralla,    uid_muralla,    'Carta La Muralla China',          'Chifa y pollería, la fusión criolla-china de la selva',        TRUE),
    (uid_menu_luciernaga, uid_luciernaga, 'Carta La Luciérnaga',            'Desayunos, caldos y platos del día con gallina de chacra',    TRUE),
    (uid_menu_wirawira,   uid_wirawira,   'Carta Wira Wira',                 'Chaufa amazónico y especialidades selváticas',                 TRUE);

  -- ============================================================
  -- PLATOS
  -- Categorías válidas: ENTRADAS SOPAS PLATOS_PRINCIPALES PARRILLAS
  --                     MARISCOS ENSALADAS POSTRES BEBIDAS
  --                     BEBIDAS_ALCOHOLICAS ESPECIALES
  -- ============================================================

  -- 1. El Encanto de la Selva
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_encanto, uid_encanto, 'Tacacho con Cecina',        'Plátano verde molido a la brasa con cecina ahumada y chorizo amazónico artesanal',         'PLATOS_PRINCIPALES', 28.00, TRUE,  TRUE, 20),
    (uid_menu_encanto, uid_encanto, 'Juane de Gallina',          'Arroz con gallina, aceituna, huevo y especias amazónicas envuelto en hoja de bijao',        'PLATOS_PRINCIPALES', 22.00, TRUE,  TRUE, 30),
    (uid_menu_encanto, uid_encanto, 'Ceviche de Doncella',       'Ceviche de pescado de río con ají limo, limón, cebolla morada, cilantro y choclo',          'MARISCOS',           25.00, TRUE,  TRUE, 15),
    (uid_menu_encanto, uid_encanto, 'Combo Amazónico',           'Cecina + chorizo amazónico + tacacho + yuca frita + ensalada criolla',                      'ESPECIALES',         38.00, TRUE,  TRUE, 25),
    (uid_menu_encanto, uid_encanto, 'Patarashca de Pescado',     'Pescado entero adobado con hierbas amazónicas cocinado en hoja de bijao sobre brasa',       'PLATOS_PRINCIPALES', 30.00, FALSE, TRUE, 35),
    (uid_menu_encanto, uid_encanto, 'Inchicapi de Gallina',      'Sopa espesa de gallina con maní, yuca y cilantro de monte, plato ritual amazónico',         'SOPAS',              18.00, FALSE, TRUE, 40),
    (uid_menu_encanto, uid_encanto, 'Cecina Frita con Yuca',     'Cecina ahumada frita acompañada de yuca y plátano maduro frito',                            'PLATOS_PRINCIPALES', 24.00, FALSE, TRUE, 15),
    (uid_menu_encanto, uid_encanto, 'Jugo de Cocona',            'Jugo natural de cocona amazónica con propiedades antioxidantes',                            'BEBIDAS',             6.00, FALSE, TRUE,  5),
    (uid_menu_encanto, uid_encanto, 'Jugo Mango-Maracuyá',       'Mezcla refrescante de mango maduro y maracuyá fresco de la selva',                          'BEBIDAS',             7.00, FALSE, TRUE,  5),
    (uid_menu_encanto, uid_encanto, 'Yuca Frita',                'Yuca fresca frita con crema de ají charapita',                                              'ENTRADAS',            8.00, FALSE, TRUE, 10),
    (uid_menu_encanto, uid_encanto, 'Plátano Frito con Miel',    'Rodajas de plátano de isla fritas con miel de abejas nativas amazónicas',                  'POSTRES',             9.00, FALSE, TRUE, 10);

  -- 2. El Carbon Resto Bar
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_carbon, uid_carbon, 'Lomo Fino a la Parrilla',    'Lomo fino de res al carbón con papas fritas y ensalada mixta',                              'PARRILLAS',          42.00, TRUE,  TRUE, 25),
    (uid_menu_carbon, uid_carbon, 'Combo Regional El Carbon',   'Dorado a la parrilla + chorizo amazónico + cecina + tacacho + yuca. Para 2 personas',       'ESPECIALES',         50.00, TRUE,  TRUE, 30),
    (uid_menu_carbon, uid_carbon, 'Costilla de Cerdo BBQ',      'Costilla de cerdo con salsa BBQ artesanal, yuca frita y ensalada',                          'PARRILLAS',          38.00, TRUE,  TRUE, 35),
    (uid_menu_carbon, uid_carbon, 'Pechuga a la Parrilla',      'Pechuga de pollo a la parrilla con papas fritas y ensalada',                                'PARRILLAS',          28.00, FALSE, TRUE, 20),
    (uid_menu_carbon, uid_carbon, 'Pollo a la Brasa Entero',    'Pollo a la brasa entero marinado con papas fritas, ensalada y ají',                         'PLATOS_PRINCIPALES', 50.00, FALSE, TRUE, 45),
    (uid_menu_carbon, uid_carbon, 'Menú Ejecutivo',             'Sopa del día + segundo + refresco natural, cambia cada día',                                 'ESPECIALES',         16.00, FALSE, TRUE, 20),
    (uid_menu_carbon, uid_carbon, 'Pisco Sour',                 'Clásico pisco sour peruano (promo 2x1 lunes a jueves)',                                     'BEBIDAS_ALCOHOLICAS', 12.00, FALSE, TRUE, 10),
    (uid_menu_carbon, uid_carbon, 'Chicharrón de Cerdo',        'Chicharrón crujiente con mote, camote y sarsa criolla',                                     'ENTRADAS',           22.00, FALSE, TRUE, 15),
    (uid_menu_carbon, uid_carbon, 'Papas a la Huancaína',       'Papas amarillas con salsa huancaína cremosa y aceitunas negras',                            'ENTRADAS',           15.00, FALSE, TRUE, 10),
    (uid_menu_carbon, uid_carbon, 'Mousse de Maracuyá',         'Mousse cremoso de maracuyá fresco de la selva con galleta',                                 'POSTRES',            12.00, FALSE, TRUE, 10);

  -- 3. D'Tinto & Madero
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_dtinto, uid_dtinto, 'Lomo Cordon Bleu',           'Lomo de res relleno de jamón y queso, apanado y frito, con papas y ensalada',               'PLATOS_PRINCIPALES', 40.00, TRUE,  TRUE, 30),
    (uid_menu_dtinto, uid_dtinto, 'Pescado al Vapor',           'Pescado de río al vapor con verduras frescas y salsa de soya con jengibre',                 'PLATOS_PRINCIPALES', 28.00, TRUE,  TRUE, 25),
    (uid_menu_dtinto, uid_dtinto, 'Lomo Saltado',               'Clásico lomo saltado con papas fritas, arroz blanco y tomate',                              'PLATOS_PRINCIPALES', 32.00, FALSE, TRUE, 20),
    (uid_menu_dtinto, uid_dtinto, 'Cóctel Selvático',           'Cóctel de frutas tropicales con ron amazónico y hierbas de la selva',                       'BEBIDAS_ALCOHOLICAS', 18.00, TRUE,  TRUE, 10),
    (uid_menu_dtinto, uid_dtinto, 'Ensalada Tropical',          'Mix de lechugas, mango, aguacate y aderezo de maracuyá',                                    'ENSALADAS',          18.00, FALSE, TRUE, 10),
    (uid_menu_dtinto, uid_dtinto, 'Papas Fritas',               'Porción generosa de papas fritas crujientes con mayonesa de ají',                           'ENTRADAS',            8.00, FALSE, TRUE,  8),
    (uid_menu_dtinto, uid_dtinto, 'Tiramisú de Café Selvático', 'Tiramisú clásico preparado con café arábica de la región de Tingo María',                   'POSTRES',            16.00, FALSE, TRUE, 10);

  -- 4. Etnica Restaurante Eco-Friendly
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_etnica, uid_etnica, 'Risotto Amazónico',          'Risotto con setas amazónicas, cecina desmenuzada y queso artesanal local',                  'PLATOS_PRINCIPALES', 38.00, TRUE,  TRUE, 35),
    (uid_menu_etnica, uid_etnica, 'Filete de Dorado al Horno',  'Filete de dorado al horno con vegetales orgánicos y salsa de cítricos amazónicos',         'PLATOS_PRINCIPALES', 40.00, TRUE,  TRUE, 30),
    (uid_menu_etnica, uid_etnica, 'Pasta al Pesto Selvático',   'Pasta fresca con pesto de hierbas amazónicas, albahaca y nueces de la selva',              'PLATOS_PRINCIPALES', 32.00, FALSE, TRUE, 25),
    (uid_menu_etnica, uid_etnica, 'Bowl Vegetariano',           'Bowl de quinua, vegetales asados, tofu y salsa de cocona',                                  'PLATOS_PRINCIPALES', 28.00, FALSE, TRUE, 20),
    (uid_menu_etnica, uid_etnica, 'Panna Cotta de Aguaje',      'Panna cotta italiana con coulis de aguaje, fruta amazónica de temporada',                   'POSTRES',            16.00, TRUE,  TRUE, 10),
    (uid_menu_etnica, uid_etnica, 'Bruschetta Amazónica',       'Pan artesanal con tomate, albahaca, cecina desmenuzada y aceite de oliva',                  'ENTRADAS',           18.00, FALSE, TRUE, 10),
    (uid_menu_etnica, uid_etnica, 'Limonada con Hierbas',       'Limonada fresca con hierbas aromáticas de la selva y azúcar orgánica',                      'BEBIDAS',             9.00, FALSE, TRUE,  5);

  -- 5. Tirol Bier & Snack
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_tirol, uid_tirol, 'Parrilla Mixta Individual',    'Mix de chorizos, costilla y pollo a la parrilla con papas y ensalada',                      'PARRILLAS',          42.00, TRUE,  TRUE, 30),
    (uid_menu_tirol, uid_tirol, 'Parrilla Mixta Para 2',        'Parrilla familiar: chorizos, costilla, pollo, yuca y ensalada para 2 personas',             'PARRILLAS',          75.00, TRUE,  TRUE, 35),
    (uid_menu_tirol, uid_tirol, 'Cerveza Artesanal Dörcher',    'Cerveza artesanal local en chope 500ml, variedad rubia o roja',                             'BEBIDAS',            15.00, TRUE,  TRUE,  2),
    (uid_menu_tirol, uid_tirol, 'Piqueo Selva',                 'Cecina, chorizo amazónico, yuca y chifles con salsa criolla',                               'ENTRADAS',           28.00, FALSE, TRUE, 15),
    (uid_menu_tirol, uid_tirol, 'Alitas BBQ',                   'Alitas de pollo con salsa BBQ artesanal y papas crujientes',                                'ENTRADAS',           24.00, FALSE, TRUE, 20),
    (uid_menu_tirol, uid_tirol, 'Hamburguesa Tirol',            'Hamburguesa doble carne, queso cheddar, tocino y papas artesanales',                        'PLATOS_PRINCIPALES', 30.00, FALSE, TRUE, 20),
    (uid_menu_tirol, uid_tirol, 'Chifles con Guacamole',        'Chifles crujientes de plátano verde con guacamole selvático',                               'ENTRADAS',           12.00, FALSE, TRUE, 10);

  -- 6. Festival Tingo María
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_festival, uid_festival, 'Maki Amazónico',           'Roll de arroz con cecina, aguacate, cocona y ají amarillo - estilo fusión selva',            'ESPECIALES',         30.00, TRUE,  TRUE, 15),
    (uid_menu_festival, uid_festival, 'Maki Tempura',             'Roll tempura con camarón, queso crema y mango, con salsa spicy amazónica',                  'ESPECIALES',         32.00, TRUE,  TRUE, 15),
    (uid_menu_festival, uid_festival, 'Fusión Amazónica Bowl',    'Bowl de arroz con ceviche de dorado, aguacate, edamame y salsa de maracuyá',               'PLATOS_PRINCIPALES', 35.00, TRUE,  TRUE, 20),
    (uid_menu_festival, uid_festival, 'Cerveza Artesanal',        'Cerveza artesanal de temporada, productores locales de Tingo María',                        'BEBIDAS',            13.00, FALSE, TRUE,  2),
    (uid_menu_festival, uid_festival, 'Pisco Sour de Cocona',     'Versión amazónica del pisco sour con jugo de cocona y pisco quebranta',                    'BEBIDAS_ALCOHOLICAS', 18.00, FALSE, TRUE, 10),
    (uid_menu_festival, uid_festival, 'Plato del Día',            'Plato con insumos locales frescos, varía según temporada',                                  'ESPECIALES',         22.00, FALSE, TRUE, 20);

  -- 7. Cevichería Lobo Azul
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_lobo, uid_lobo, 'Ceviche de Dorado',             'Ceviche de dorado (pescado de río) con ají limo, limón, cebolla morada y choclo',            'MARISCOS',           28.00, TRUE,  TRUE, 15),
    (uid_menu_lobo, uid_lobo, 'Ceviche Mixto',                 'Mezcla de ceviche de pescado y mariscos con leche de tigre picante',                         'MARISCOS',           35.00, TRUE,  TRUE, 15),
    (uid_menu_lobo, uid_lobo, 'Jalea Norteña',                 'Mix de pescado y mariscos apanados y fritos con sarsa criolla y yuca',                       'MARISCOS',           35.00, FALSE, TRUE, 20),
    (uid_menu_lobo, uid_lobo, 'Arroz con Mariscos',            'Arroz con mariscos frescos, ají amarillo, culantro y queso parmesano',                       'MARISCOS',           35.00, FALSE, TRUE, 25),
    (uid_menu_lobo, uid_lobo, 'Chicharrón de Pescado',         'Pescado apanado y frito con yuca, chifles y sarsa criolla',                                  'PLATOS_PRINCIPALES', 28.00, FALSE, TRUE, 20),
    (uid_menu_lobo, uid_lobo, 'Parihuela Mixta',               'Caldo picante de mariscos y pescado servido con arroz blanco',                               'SOPAS',              38.00, FALSE, TRUE, 30),
    (uid_menu_lobo, uid_lobo, 'Tortilla de Camarones',         'Tortilla esponjosa con camarones frescos, hierbas y ají',                                    'ENTRADAS',           22.00, FALSE, TRUE, 15),
    (uid_menu_lobo, uid_lobo, 'Leche de Tigre',                'Jugo de ceviche concentrado con canchita y trozos de pescado',                               'ENTRADAS',           12.00, FALSE, TRUE,  5),
    (uid_menu_lobo, uid_lobo, 'Chicha Morada',                 'Chicha morada natural con maíz morado y frutas',                                             'BEBIDAS',             7.00, FALSE, TRUE,  5);

  -- 8. Sabor a Selva - Tacachería Pizarro
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_sabor, uid_sabor, 'Tacacho con Cecina',           'Tacacho de plátano verde molido a la brasa con cecina ahumada artesanal',                   'PLATOS_PRINCIPALES', 18.00, TRUE,  TRUE, 15),
    (uid_menu_sabor, uid_sabor, 'Tacacho con Chorizo',          'Tacacho con chorizo amazónico casero y ají charapita fresco',                               'PLATOS_PRINCIPALES', 17.00, TRUE,  TRUE, 15),
    (uid_menu_sabor, uid_sabor, 'Juane de Gallina',             'Juane amazónico tradicional con gallina, arroz y aceituna en hoja de bijao',                'PLATOS_PRINCIPALES', 18.00, TRUE,  TRUE, 25),
    (uid_menu_sabor, uid_sabor, 'Patarashca de Paiche',         'Paiche entero adobado cocinado en hoja de bijao con ají y hierbas amazónicas',              'PLATOS_PRINCIPALES', 25.00, FALSE, TRUE, 35),
    (uid_menu_sabor, uid_sabor, 'Inchicapi de Gallina',         'Sopa amazónica ancestral de gallina con maní y yuca',                                       'SOPAS',              15.00, FALSE, TRUE, 40),
    (uid_menu_sabor, uid_sabor, 'Jugo de Camu Camu',            'Jugo natural de camu camu, la fruta con más vitamina C del mundo',                           'BEBIDAS',             6.00, FALSE, TRUE,  5),
    (uid_menu_sabor, uid_sabor, 'Jugo de Aguaje',               'Jugo natural de aguaje, fruto amazónico de alto valor nutricional',                          'BEBIDAS',             6.00, FALSE, TRUE,  5),
    (uid_menu_sabor, uid_sabor, 'Chifles',                      'Chifles crujientes de plátano verde con ají charapita',                                     'ENTRADAS',            5.00, FALSE, TRUE,  8);

  -- 9. Puro Aroma Cafetería
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_puro, uid_puro, 'Café Americano',                 'Café arábica de altura de Tingo María, preparación V60 o chemex',                           'BEBIDAS',             7.00, TRUE,  TRUE,  8),
    (uid_menu_puro, uid_puro, 'Café Sour',                      'Cóctel de café especial con limón, azúcar, hielo y espuma de clara de huevo',               'BEBIDAS_ALCOHOLICAS', 12.00, TRUE,  TRUE, 10),
    (uid_menu_puro, uid_puro, 'Bella Durmiente',                'Café especial con lúcuma y leche espumada, inspirado en la montaña de Tingo María',         'BEBIDAS',            11.00, TRUE,  TRUE, 10),
    (uid_menu_puro, uid_puro, 'Café Macchiato',                 'Espresso doble con toque de leche espumada y sirope de vainilla',                           'BEBIDAS',             8.00, FALSE, TRUE,  8),
    (uid_menu_puro, uid_puro, 'Orange Coffee',                  'Café frío con jugo de naranja, hielo y espuma de café',                                     'BEBIDAS',            10.00, FALSE, TRUE, 10),
    (uid_menu_puro, uid_puro, 'Desayuno Selvático',             'Jugo natural + 2 panes con mantequilla y mermelada casera + café o té',                     'PLATOS_PRINCIPALES', 18.00, FALSE, TRUE, 10),
    (uid_menu_puro, uid_puro, 'Tostadas con Palta',             'Tostadas de pan artesanal con palta, huevo pochado y semillas de chía',                     'ENTRADAS',           14.00, FALSE, TRUE, 12),
    (uid_menu_puro, uid_puro, 'Café en Grano 250g',             'Café arábica en grano seleccionado de la región, para llevar',                              'ESPECIALES',         45.00, FALSE, TRUE,  5),
    (uid_menu_puro, uid_puro, 'Cheesecake de Maracuyá',         'Cheesecake cremoso con coulis de maracuyá fresco de la selva',                              'POSTRES',            14.00, FALSE, TRUE,  5);

  -- 10. Chifa Pollería La Muralla China
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_muralla, uid_muralla, 'Arroz Chaufa de Pollo',      'Arroz frito cantonés con pollo, huevo, cebolla china y kion',                               'PLATOS_PRINCIPALES', 18.00, TRUE,  TRUE, 15),
    (uid_menu_muralla, uid_muralla, 'Arroz Chaufa de Mariscos',   'Chaufa con mariscos frescos, huevo, sillao y cebolla china',                                'PLATOS_PRINCIPALES', 25.00, FALSE, TRUE, 18),
    (uid_menu_muralla, uid_muralla, 'Sopa Wonton',                'Sopa con dumplings de cerdo y camarón en caldo sazonado con kion',                         'SOPAS',              15.00, FALSE, TRUE, 15),
    (uid_menu_muralla, uid_muralla, 'Pollo a la Brasa Entero',    'Pollo a la brasa marinado con especias, con papas y ensalada',                             'PLATOS_PRINCIPALES', 52.00, TRUE,  TRUE, 50),
    (uid_menu_muralla, uid_muralla, 'Cuarto de Pollo a la Brasa', 'Cuarto de pollo a la brasa con papas fritas y ensalada',                                   'PLATOS_PRINCIPALES', 15.00, FALSE, TRUE, 50),
    (uid_menu_muralla, uid_muralla, 'Combinado Chifa + Brasa',    'Arroz chaufa + cuarto de pollo a la brasa, la combinación perfecta',                       'ESPECIALES',         25.00, TRUE,  TRUE, 50),
    (uid_menu_muralla, uid_muralla, 'Tallarín Saltado',           'Tallarín de huevo salteado con carne, verduras y sillao',                                  'PLATOS_PRINCIPALES', 20.00, FALSE, TRUE, 15),
    (uid_menu_muralla, uid_muralla, 'Inca Kola 500ml',            'Bebida nacional peruana',                                                                   'BEBIDAS',             4.00, FALSE, TRUE,  2);

  -- 11. La Luciérnaga
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_luciernaga, uid_luciernaga, 'Caldo de Gallina con Arroz',   'El único en Tingo María: caldo de gallina de chacra con arroz, preparación artesanal',  'SOPAS',              20.00, TRUE,  TRUE, 45),
    (uid_menu_luciernaga, uid_luciernaga, 'Caldo de Gallina con Fideos',  'Caldo de gallina de chacra con fideos y verduras, reconfortante',                        'SOPAS',              20.00, TRUE,  TRUE, 45),
    (uid_menu_luciernaga, uid_luciernaga, 'Sopa a la Minuta',             'Sopa de fideos con carne molida, leche y orégano, clásico reconfortante',               'SOPAS',              15.00, FALSE, TRUE, 20),
    (uid_menu_luciernaga, uid_luciernaga, 'Menú del Día',                 'Sopa + segundo + refresco natural, varía cada día con insumos frescos locales',          'ESPECIALES',         14.00, FALSE, TRUE, 20),
    (uid_menu_luciernaga, uid_luciernaga, 'Segundo con Arroz y Menestra', 'Pollo, res o cerdo con arroz blanco, menestra y ensalada fresca',                        'PLATOS_PRINCIPALES', 12.00, FALSE, TRUE, 15),
    (uid_menu_luciernaga, uid_luciernaga, 'Jugo Natural del Día',         'Jugo de frutas amazónicas de temporada: cocona, maracuyá, piña o mango',                'BEBIDAS',             6.00, FALSE, TRUE,  5),
    (uid_menu_luciernaga, uid_luciernaga, 'Emoliente con Hierbas',        'Bebida caliente de hierbas medicinales amazónicas, ideal para las mañanas frías',       'BEBIDAS',             5.00, FALSE, TRUE,  5);

  -- 12. Wira Wira Tingo María
  INSERT INTO dishes (menu_id, restaurant_id, name, description, category, price, is_featured, is_available, preparation_time) VALUES
    (uid_menu_wirawira, uid_wirawira, 'Chaufa Wira Wira',               'La especialidad: chaufa con cecina, chorizo amazónico y chicharrón + maduro frito',     'ESPECIALES',         22.00, TRUE,  TRUE, 20),
    (uid_menu_wirawira, uid_wirawira, 'Tacacho con Cecina y Chorizo',   'Tacacho doble con cecina ahumada y chorizo amazónico de primera calidad',               'PLATOS_PRINCIPALES', 20.00, TRUE,  TRUE, 15),
    (uid_menu_wirawira, uid_wirawira, 'Chaufa de Cecina',               'Arroz chaufa al estilo amazónico con cecina ahumada y ají charapita',                   'PLATOS_PRINCIPALES', 18.00, FALSE, TRUE, 15),
    (uid_menu_wirawira, uid_wirawira, 'Juane de Pollo',                 'Juane amazónico con pollo, arroz y especias envuelto en hoja de bijao',                  'PLATOS_PRINCIPALES', 18.00, FALSE, TRUE, 30),
    (uid_menu_wirawira, uid_wirawira, 'Plátano Maduro Frito',           'Rodajas de plátano maduro de isla fritas, dulce y suave',                               'ENTRADAS',            6.00, FALSE, TRUE,  8),
    (uid_menu_wirawira, uid_wirawira, 'Jugo de Cocona con Miel',        'Jugo de cocona amazónica endulzado con miel de abejas nativas de la selva',             'BEBIDAS',             7.00, FALSE, TRUE,  5),
    (uid_menu_wirawira, uid_wirawira, 'Chicha de Maíz Morado',          'Chicha morada casera con canela, clavo de olor y piña',                                 'BEBIDAS',             5.00, FALSE, TRUE,  5);

  -- ============================================================
  -- PROMOCIONES
  -- promo_type: PERCENTAGE | FIXED_AMOUNT | FREE_ITEM | COMBO
  -- ============================================================
  INSERT INTO promotions (restaurant_id, title, description, promo_type, discount_value, promo_code, valid_from, valid_until, is_active, usage_limit) VALUES
    (uid_encanto,
     'Almuerzo Selvático para 2',
     '2 Juanes + 2 Tacachos con cecina + 2 jugos selváticos por precio especial',
     'FIXED_AMOUNT', 15.00, 'ENCANTO15',
     NOW(), NOW() + INTERVAL '6 months', TRUE, 100),

    (uid_carbon,
     '2x1 en Pisco Sour - Lunes a Jueves',
     'Pide 2 Pisco Sour y paga solo 1. Válido de lunes a jueves toda la noche',
     'PERCENTAGE', 50.00, 'CARBON2X1',
     NOW(), NOW() + INTERVAL '12 months', TRUE, NULL),

    (uid_carbon,
     '15% en tu Primera Reserva de Evento',
     'Descuento del 15% para eventos corporativos o sociales reservados por primera vez',
     'PERCENTAGE', 15.00, 'CARBONEVENTO',
     NOW(), NOW() + INTERVAL '12 months', TRUE, 50),

    (uid_lobo,
     'Ceviche + Chicha Morada S/30',
     'Ceviche de dorado + chicha morada por solo S/30. Ahorra S/5',
     'FIXED_AMOUNT', 5.00, 'LOBO30',
     NOW(), NOW() + INTERVAL '3 months', TRUE, 200),

    (uid_sabor,
     'Combo Tacacho Doble',
     '2 Tacachos con cecina o chorizo + 2 jugos selváticos a precio especial',
     'FIXED_AMOUNT', 8.00, 'SABORCOMBO',
     NOW(), NOW() + INTERVAL '6 months', TRUE, 150),

    (uid_puro,
     'Happy Hour Café 3PM - 5PM',
     '20% de descuento en todos los cafés de especialidad de 3 PM a 5 PM',
     'PERCENTAGE', 20.00, 'PUROHH',
     NOW(), NOW() + INTERVAL '12 months', TRUE, NULL),

    (uid_tirol,
     'Jueves de Parrilla',
     'Parrilla mixta para 2 personas + 2 cervezas artesanales Dörcher por S/80',
     'FIXED_AMOUNT', 10.00, 'TIROLJUEVES',
     NOW(), NOW() + INTERVAL '6 months', TRUE, 80),

    (uid_festival,
     'Pack Makis + Cerveza Artesanal',
     '4 Makis amazónicos + 2 cervezas artesanales de temporada por S/65',
     'FIXED_AMOUNT', 10.00, 'FESTPACK',
     NOW(), NOW() + INTERVAL '6 months', TRUE, 100),

    (uid_etnica,
     'Menú Degustación Eco Completo',
     'Entrada + plato principal + postre + bebida, la experiencia eco-gastronómica completa',
     'FIXED_AMOUNT', 20.00, 'ETNICADEG',
     NOW(), NOW() + INTERVAL '6 months', TRUE, 40),

    (uid_dtinto,
     'Cena Romántica para 2',
     'Lomo Cordon Bleu + Pescado al Vapor + 2 Cócteles Selváticos + Tiramisú',
     'FIXED_AMOUNT', 25.00, 'DTINTOROMANCE',
     NOW(), NOW() + INTERVAL '6 months', TRUE, 30);

  RAISE NOTICE 'V3: 12 restaurantes reales de Tingo María insertados correctamente.';
  RAISE NOTICE 'V3: 12 owners, 12 restaurantes, 84 platos, 12 menús, 10 promociones.';

END $$;
