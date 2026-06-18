# Sistema de Restaurantes — Plataforma Turística Tingo María

Sistema independiente y autónomo de gestión de restaurantes, parte del ecosistema turístico de Tingo María, Huánuco, Perú.

Monorepo con dos desplegables más una base de datos PostGIS:

- `restaurants-backend/` — Java 21 / Spring Boot 3.2, arquitectura hexagonal, API REST en el puerto 8080 (context path `/api`).
- `restaurants-frontend/` — Next.js 14 (App Router) / TypeScript, puerto 3000.
- PostgreSQL 16 + PostGIS (búsqueda geoespacial) + Flyway (migraciones), puerto 5432.

---

## Arquitectura

```
              restaurants-frontend     Next.js 14 + TypeScript + TailwindCSS
                   (Puerto 3000)
                        |  REST API / JSON
              restaurants-backend      Java 21 + Spring Boot 3 (hexagonal)
                   (Puerto 8080, /api)
                        |
                  PostgreSQL 16        + PostGIS (geolocalización)
                   (Puerto 5432)       + Flyway (migraciones)
```

### Capas del backend (hexagonal / ports & adapters)

```
src/main/java/com/tingo/restaurants/
  domain/           Núcleo de negocio puro (sin dependencias externas)
    model/          Entidades de dominio + enums
    repository/     Puertos (interfaces)
    exception/      Excepciones de dominio
    event/          Eventos de dominio
  application/      Casos de uso
    service/        Orquestación de use cases
    dto/request/    DTOs de entrada (Jakarta Validation)
    dto/response/   DTOs de salida (envoltura ApiResponse)
    mapper/         MapStruct mappers
  infrastructure/   Adaptadores
    persistence/    JPA entities, repositories y adapters (mapeo manual a dominio)
    web/controller/ Controladores REST
    web/exception/  GlobalExceptionHandler
    security/       JWT, UserDetailsService, OwnershipGuard, LoginAttemptService
  config/           SecurityConfig, SwaggerConfig, CorsConfig
```

---

## Inicio rápido (Docker)

El flujo principal es Docker Compose desde la raíz del repo. El modo por defecto es **producción**.

```bash
# 1. Configurar variables de entorno
cp .env.example .env        # editar con tus valores

# 2. Construir y levantar todo el stack
docker compose up -d --build

# 3. Bajar todo (los datos persisten en el volumen de postgres)
docker compose down
```

### Comandos frecuentes

```bash
docker compose up -d                      # levantar (sin reconstruir)
docker compose up -d --build              # reconstruir imágenes y levantar
docker compose up -d --build backend      # reconstruir solo backend (tras cambios Java)
docker compose up -d --build frontend     # reconstruir solo frontend (tras cambios Next.js)
docker compose down                       # detener y eliminar contenedores (datos a salvo)
docker compose down && docker compose up -d   # recrea la red: arregla "UnknownHostException: postgres"
                                              # que aparece a veces tras reconstruir contenedores
docker compose logs -f backend            # ver logs del backend
docker exec -it restaurants-postgres psql -U tingo_user -d restaurants_db   # consola SQL
```

> Nota: si tras un `--build` el backend entra en bucle de reinicio con `UnknownHostException: postgres`,
> es una desincronización de la red de Docker. Solución: `docker compose down && docker compose up -d`
> (recrea la red desde cero; los datos persisten en el volumen).

### Modo desarrollo (hot-reload)

`docker-compose.dev.yml` monta el `src/` del frontend para recarga en caliente (usa `Dockerfile.dev`).
Adminer (UI de la BD) solo se levanta bajo este modo.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# Adminer disponible en http://localhost:8888
```

### URLs

- Frontend: `http://localhost:3000`
- API: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- Adminer (solo modo dev): `http://localhost:8888`

---

## Desarrollo local (sin Docker)

### Backend

No hay Maven wrapper (`./mvnw` no existe): usa un `mvn` del sistema (requiere Java 21) y una instancia de PostGIS corriendo.

```bash
cd restaurants-backend
mvn spring-boot:run
mvn clean package          # genera el jar (el build de Docker usa -DskipTests)
```

### Frontend

```bash
cd restaurants-frontend
npm install
npm run dev          # servidor de desarrollo
npm run build        # build de producción (output: standalone)
npm run lint         # eslint
npm run type-check   # tsc --noEmit (validación de tipos)
```

---

## Autenticación y roles

Credenciales por defecto (datos seed locales):

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@tingo-restaurants.com` | `Admin@1234!` |
| Dueño de restaurante | `owner.<nombre>@tingomaria.com` (ej. `owner.carbon@tingomaria.com`) | `Admin@1234!` |

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Control total del sistema |
| `RESTAURANTE_OWNER` | Gestión de sus propios restaurantes |
| `CLIENTE` | Reservas y consultas |
| `SYSTEM_INTEGRATION` | APIs de integración entre sistemas del ecosistema |

Seguridad: JWT stateless. La autorización fina es por `@PreAuthorize` en los controladores, y el
acceso a recursos se valida por propiedad (`OwnershipGuard`): un dueño solo opera sobre sus propios
restaurantes, menús, platos, promociones, imágenes y reservas. El login tiene rate limiting
(bloqueo tras 10 intentos fallidos).

---

## APIs principales

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/auth/register` | Registrar usuario | Público |
| `POST` | `/v1/auth/login` | Login (JWT) | Público |
| `GET` | `/v1/restaurants` | Listar restaurantes activos | Público |
| `GET` | `/v1/restaurants/search` | Buscar con filtros | Público |
| `GET` | `/v1/restaurants/nearby?lat=&lon=&radiusKm=` | Búsqueda geoespacial | Público |
| `POST` | `/v1/restaurants` | Crear restaurante | OWNER/ADMIN |
| `PUT` | `/v1/restaurants/{id}` | Editar restaurante (solo dueño/ADMIN) | OWNER/ADMIN |
| `POST` | `/v1/reservations` | Crear reserva | Autenticado |
| `GET` | `/v1/reservations/code/{code}` | Consultar reserva por código | Público |
| `PATCH` | `/v1/reservations/{id}/confirm` | Confirmar reserva (dueño del local) | OWNER/ADMIN |
| `GET` | `/v1/integration/**` | Catálogo para sistemas externos | SYSTEM_INTEGRATION |

Documentación completa en Swagger: `http://localhost:8080/api/swagger-ui.html`

---

## Base de datos

- PostgreSQL 16 con extensión PostGIS para búsquedas geoespaciales.
- Flyway para versionado de migraciones (`src/main/resources/db/migration/V{n}__*.sql`).
  El esquema es solo-Flyway (`ddl-auto: validate`); nunca se edita una migración ya aplicada.
- Soft delete en las entidades (campo `deleted_at`); las lecturas filtran `deleted_at IS NULL`.

---

## Integración con el ecosistema

El sistema expone `/v1/integration/**` (rol `SYSTEM_INTEGRATION`) para consumo por los sistemas de
Eventos, Hoteles, Turismo y Transporte. La integración aún no está implementada: el endpoint
`GET /v1/restaurants/near-event/{eventId}` existe pero por ahora devuelve vacío (placeholder),
a la espera de conectar con el Sistema de Eventos.

---

## Stack tecnológico

Backend: Java 21, Spring Boot 3.2, Spring Security + JWT, Spring Data JPA / Hibernate,
PostgreSQL + PostGIS, Flyway, MapStruct, Lombok, Swagger/OpenAPI 3, Maven.

Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query (React Query v5),
Zustand, React Hook Form + Zod, Lucide Icons, Recharts, React Leaflet.

DevOps: Docker, Docker Compose (multi-stage builds), Adminer.

---

## Roadmap

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Core del sistema (restaurantes, menús, auth) | Hecho |
| Fase 2 | Reservas y disponibilidad | Hecho |
| Fase 3 | Integración con Sistema de Eventos | En desarrollo |
| Fase 4 | Integración con Hoteles y Turismo | Pendiente |
| Fase 5 | Cache con Redis | Pendiente |
| Fase 6 | Eventos asíncronos (RabbitMQ/Kafka) | Pendiente |
| Fase 7 | API Gateway y escalabilidad horizontal | Pendiente |

---

## Buenas prácticas implementadas

- Arquitectura hexagonal (Ports & Adapters); dominio desacoplado de JPA.
- DTO Pattern y envoltura uniforme de respuestas (`ApiResponse<T>`).
- GlobalExceptionHandler para errores consistentes.
- Soft delete y auditoría (`created_at` / `updated_at`).
- JWT stateless; validación de propiedad por recurso (`OwnershipGuard`).
- Rate limiting de login (bloqueo tras 10 intentos fallidos).
- Validación de entrada con Jakarta Validation en los DTOs de request.
- Búsqueda geoespacial con PostGIS (`ST_DWithin` / `ST_Distance`).
- En producción, secretos obligatorios por entorno (`JWT_SECRET`, `DB_PASSWORD`): la app no arranca si faltan.
