# Sistema de Restaurantes — Tingo María
## Resumen de cambios y manual de uso

---

## Credenciales de acceso

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | `admin@tingo-restaurants.com` | `Admin@1234!` |
| Dueño de restaurante | `owner.carbon@tingomaria.com` | `Admin@1234!` |
| (cualquier owner) | `owner.<nombre>@tingomaria.com` | `Admin@1234!` |

---

## Cambios realizados

### Backend (Spring Boot)

#### Corrección crítica de base de datos
- **Error `lower(bytea)`**: La consulta de búsqueda de restaurantes fallaba porque Hibernate enviaba parámetros `null` como tipo `bytea` a PostgreSQL. Se convirtió la consulta JPQL a SQL nativo con `CAST(:name AS text)`.
- Se eliminó el parámetro `status` no usado del método `findByFilters`.

#### Datos de restaurantes reales
- Migración **V3**: 12 restaurantes reales de Tingo María con direcciones, coordenadas GPS (PostGIS), horarios, menús, platos y promociones.
- Restaurantes incluidos: Etnica Eco-Friendly, La Luciérnaga, Wira Wira, El Carbon Resto Bar, D'Tinto y Madero, El Encanto de la Selva, Tirol Restaurante, y más.

#### Gestión de usuarios (nuevo)
Endpoints creados en `GET/PATCH /api/v1/users`:

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/v1/users` | ADMIN | Listar todos los usuarios (paginado) |
| PATCH | `/v1/users/{id}/role` | ADMIN | Cambiar rol de usuario |
| PATCH | `/v1/users/{id}/toggle-active` | ADMIN | Activar/desactivar usuario |
| DELETE | `/v1/users/{id}` | ADMIN | Eliminar usuario (soft delete) |
| GET | `/v1/users/me` | Todos | Ver mi perfil |
| PATCH | `/v1/users/me` | Todos | Editar mi perfil / cambiar contraseña |

---

### Frontend (Next.js)

#### Autenticación
- **Persistencia de sesión**: Corregido el bug que cerraba la sesión al presionar F5. El dashboard ahora muestra un spinner mientras Zustand rehidrata desde `localStorage`, evitando la redirección incorrecta al login.
- **Login**: Añadido botón de visibilidad de contraseña (ojo) y botón "Volver" que lleva al inicio.

#### Sidebar / Navegación
- El ícono del logo es más prominente (igual al de la pantalla de login).
- "Inicio" ya no se muestra activo cuando se está en otras secciones del dashboard.
- La sección de usuario en la parte inferior es clickeable → abre la página de perfil.
- **Reportes** ahora visible también para dueños de restaurante.
- Los textos del menú cambian con el idioma seleccionado.

#### Página de Usuarios (rediseñada)
- Tabla completa con todos los usuarios del sistema.
- Cambio de rol desde un `select` inline en la tabla.
- Toggle de activación/desactivación con un clic.
- Eliminación con confirmación.
- **Paginación** en la parte superior: 5 o 10 usuarios por página con botones primera/última página.

#### Selector de Restaurante (nuevo componente)
- Reemplaza el `<select>` de texto plano en Menús y Promociones.
- Muestra una grilla visual de tarjetas con avatar de color, nombre y ubicación del restaurante.
- El admin ve todos los restaurantes; el dueño ve solo los suyos.

#### Página de Perfil (nueva)
- Accesible desde el nombre de usuario en el sidebar.
- Permite editar nombre completo y teléfono.
- Permite cambiar la contraseña (requiere contraseña actual).
- El email no se puede modificar.

#### Reportes
- El admin ahora ve el conteo real de todos los restaurantes del sistema (antes mostraba 0).
- Los dueños de restaurante pueden acceder a sus propias estadísticas.

#### Tema oscuro / claro
- Botón flotante en la esquina inferior derecha (ícono de engranaje).
- Alterna entre modo claro y oscuro.
- El modo oscuro adapta fondos, textos y bordes de toda la aplicación.
- La preferencia se guarda automáticamente.

#### Idioma (Español / Inglés)
- En el mismo botón flotante de configuración.
- Cambia los textos de navegación, la página de restaurantes y controles generales.
- La preferencia se guarda automáticamente.

#### Eliminación de emojis
- Se eliminaron todos los emojis del código fuente del frontend y se reemplazaron por íconos de `lucide-react`.

---

## Comandos útiles

```bash
# Iniciar todo el sistema
docker compose up -d

# Reconstruir el backend (tras cambios en Java)
docker compose up --build backend -d

# Reconstruir el frontend (tras cambios en Next.js)
docker compose up --build frontend -d


# Acceder a la base de datos
docker exec -it restaurants-postgres psql -U tingo_user -d restaurants_db
```

## URLs del sistema

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| Adminer (BD) | http://localhost:8888 |

---

## Arquitectura resumida

```
restaurants-frontend/          Next.js 14 (App Router, TypeScript)
├── src/app/                   Páginas y rutas
│   ├── (auth)/login           Login con toggle de contraseña
│   ├── restaurants/           Listado público de restaurantes
│   ├── dashboard/             Panel de administración
│   │   ├── restaurants/       CRUD de restaurantes
│   │   ├── menus/             Gestión de menús y platos
│   │   ├── promotions/        Gestión de promociones
│   │   ├── reservations/      Gestión de reservas
│   │   ├── reports/           Estadísticas
│   │   ├── users/             Administración de usuarios
│   │   └── profile/           Perfil del usuario
├── src/store/
│   ├── authStore.ts           Estado de autenticación (Zustand + localStorage)
│   └── uiStore.ts             Tema y idioma (Zustand + localStorage)
├── src/components/ui/
│   ├── RestaurantPicker.tsx   Selector visual de restaurantes
│   ├── SettingsWidget.tsx     Widget flotante tema/idioma
│   └── ThemeProvider.tsx      Aplica clase dark al HTML
└── src/hooks/
    └── useTranslation.ts      Hook de i18n (ES/EN)

restaurants-backend/           Spring Boot 3.2 (Java 21)
├── domain/                    Modelos y repositorios (interfaces)
├── application/               Servicios y DTOs
├── infrastructure/
│   ├── persistence/           Entidades JPA, repositorios, adaptadores
│   ├── web/controller/        REST Controllers
│   └── security/              JWT + Spring Security
└── resources/db/migration/    Flyway: V1 (schema), V2 (seed), V3 (restaurantes reales)
```

---

*Sistema desarrollado para la Plataforma Turística de Tingo María — 2025*
