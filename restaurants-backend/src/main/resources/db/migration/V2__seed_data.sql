-- ============================================================
-- V2: Datos semilla iniciales
-- ============================================================

-- Categorías de comida
INSERT INTO food_categories (id, name, description, icon_url) VALUES
  (uuid_generate_v4(), 'Comida Peruana', 'Gastronomía típica peruana', '/icons/peruvian.svg'),
  (uuid_generate_v4(), 'Mariscos', 'Pescados y mariscos frescos', '/icons/seafood.svg'),
  (uuid_generate_v4(), 'Parrillas', 'Carnes a la parrilla y BBQ', '/icons/grill.svg'),
  (uuid_generate_v4(), 'Comida Selvática', 'Gastronomía típica de la selva amazónica', '/icons/jungle.svg'),
  (uuid_generate_v4(), 'Vegetariana', 'Opciones vegetarianas y veganas', '/icons/vegan.svg'),
  (uuid_generate_v4(), 'Pizzas y Pastas', 'Comida italiana', '/icons/italian.svg'),
  (uuid_generate_v4(), 'Pollos y Frituras', 'Pollos a la brasa y frituras', '/icons/chicken.svg'),
  (uuid_generate_v4(), 'Cafetería', 'Cafés, sándwiches y desayunos', '/icons/cafe.svg');

-- Usuario ADMIN inicial (password: Admin@1234!)
-- Hash bcrypt de 'Admin@1234!'
INSERT INTO users (id, email, password_hash, full_name, role, is_active, email_verified) VALUES
  (uuid_generate_v4(), 'admin@tingo-restaurants.com',
   '$2a$12$Vl2VwOkP9h0HwMzVE1eHx.6M/P.rdZvLXZLDPlv84SR3lYgiW8A/2',
   'Administrador del Sistema', 'ADMIN', TRUE, TRUE);
