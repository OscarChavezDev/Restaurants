# 🍽️ Sistema de Restaurantes — Plataforma Turística Tingo María

Sistema independiente y autónomo de gestión de restaurantes, parte del ecosistema turístico de Tingo María, Huánuco, Perú.

---

## 🏗️ Arquitectura      

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA TURÍSTICO                         │
│  [Eventos] ←→  [Restaurantes]  ←→ [Hoteles] ←→ [Turismo]      │
└─────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │    restaurants-frontend  │  Next.js 14 + TypeScript
              │         (Port 3000)      │  TailwindCSS + Shadcn/UI
              └────────────┬────────────┘
                           │ REST API / JSON
              ┌────────────┴────────────┐
              │    restaurants-backend   │  Java 21 + Spring Boot 3
              │         (Port 8080)      │  Arquitectura Hexagonal
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │       PostgreSQL         │  + PostGIS para geolocalización
              │         (Port 5432)      │  + Flyway para migraciones
              └─────────────────────────┘
```

### Capas del Backend (Arquitectura Hexagonal)

```
src/main/java/com/tingo/restaurants/
├── domain/                          # 🎯 NÚCLEO (sin dependencias externas)
│   ├── model/                       # Entidades de negocio puras
│   │   ├── Restaurant.java
│   │   ├── Reservation.java
│   │   ├── Menu.java, Dish.java
│   │   ├── Rating.java, Promotion.java
│   │   └── enums/                   # ReservationStatus, UserRole...
│   ├── repository/                  # Puertos de salida (interfaces)
│   ├── exception/                   # Excepciones de dominio
│   └── event/                       # Eventos de dominio
│
├── application/                     # 🔄 CASOS DE USO
│   ├── service/                     # Implementaciones de use cases
│   │   ├── RestaurantService.java
│   │   ├── ReservationService.java
│   │   └── AuthService.java
│   ├── dto/request/                 # DTOs de entrada con validaciones
│   ├── dto/response/                # DTOs de salida
│   └── mapper/                      # MapStruct mappers
│
└── infrastructure/                  # 🔌 ADAPTADORES
    ├── persistence/                 # JPA entities, repositories, adapters
    ├── web/controller/              # REST Controllers
    ├── web/exception/               # GlobalExceptionHandler
    ├── security/                    # JWT filter, UserDetailsService
    └── integration/                 # Clientes externos (eventos, hoteles)

config/                              # SecurityConfig, SwaggerConfig, CorsConfig
```

---

## 🚀 Inicio Rápido

### Con Docker (recomendado)

```bash
# 1. Clonar y configurar
cp .env.example .env
# Editar .env con tus valores

# 2. Levantar todo el stack
docker-compose up -d

# 3. Acceder
# Frontend:    http://localhost:3000
# Backend API: http://localhost:8080/api
# Swagger UI:  http://localhost:8080/api/swagger-ui.html
# Adminer BD:  http://localhost:8888
```

### Desarrollo Local

**Backend:**
```bash
cd restaurants-backend
cp .env.example .env
# Asegúrate de tener PostgreSQL con PostGIS corriendo
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd restaurants-frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## 🔐 Autenticación

**Usuario admin por defecto:**
- Email: `admin@tingo-restaurants.com`
- Password: `Admin@1234!`

**Roles del sistema:**
| Rol | Acceso |
|-----|--------|
| `ADMIN` | Control total |
| `RESTAURANTE_OWNER` | Gestión de su restaurante |
| `CLIENTE` | Reservas y consultas |
| `SYSTEM_INTEGRATION` | APIs de integración entre microservicios |

---

## 📡 APIs Principales

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/auth/register` | Registrar usuario | Público |
| `POST` | `/v1/auth/login` | Login (JWT) | Público |
| `GET` | `/v1/restaurants` | Listar restaurantes activos | Público |
| `GET` | `/v1/restaurants/search` | Buscar con filtros | Público |
| `GET` | `/v1/restaurants/nearby?lat=&lon=&radiusKm=` | Geoespacial | Público |
| `GET` | `/v1/restaurants/near-event/{eventId}` | Cercanos a evento | Público |
| `POST` | `/v1/restaurants` | Crear restaurante | OWNER/ADMIN |
| `POST` | `/v1/reservations` | Crear reserva | Autenticado |
| `GET` | `/v1/reservations/code/{code}` | Buscar por código | Público |
| `PATCH` | `/v1/reservations/{id}/confirm` | Confirmar reserva | OWNER/ADMIN |
| `GET` | `/v1/integration/restaurants` | Catálogo para sistemas externos | SYSTEM_INTEGRATION |

**Documentación completa:** `http://localhost:8080/api/swagger-ui.html`

---

## 🗄️ Base de Datos

- **PostgreSQL 16** con extensión **PostGIS** para búsquedas geoespaciales
- **Flyway** para versionado de migraciones
- **Soft Delete** en todas las entidades críticas
- **Auditoría automática** (created_at, updated_at via triggers)
- **Índices optimizados** para búsquedas frecuentes

---

## 🔗 Integración con el Ecosistema

El sistema expone APIs REST en `/v1/integration/**` para consumo por:
- **Sistema de Eventos**: restaurantes cercanos a eventos con `near-event/{eventId}`
- **Sistema de Hoteles**: disponibilidad y catálogo por ciudad
- **Sistema de Turismo**: catálogo completo de restaurantes con geolocalización
- **Sistema de Transporte**: ubicaciones para planificación de rutas

---

## 🛠️ Stack Tecnológico

**Backend:**
- Java 21 · Spring Boot 3.2 · Spring Security · JWT
- Spring Data JPA · Hibernate · PostgreSQL · PostGIS
- Flyway · MapStruct · Lombok · Swagger/OpenAPI 3
- Maven · SLF4J + Logback

**Frontend:**
- Next.js 14 (App Router) · TypeScript · TailwindCSS
- TanStack Query (React Query v5) · Zustand
- React Hook Form · Zod · Lucide Icons
- Recharts · React Leaflet · Framer Motion

**DevOps:**
- Docker · Docker Compose · Multi-stage builds
- PostGIS · Adminer

---

## 📋 Roadmap

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Core del sistema (restaurantes, menús, auth) | ✅ |
| Fase 2 | Reservas y disponibilidad en tiempo real | ✅ |
| Fase 3 | Integración con Sistema de Eventos | 🔄 |
| Fase 4 | Integración con Hoteles y Turismo | 🔜 |
| Fase 5 | Cache con Redis · Rate limiting | 🔜 |
| Fase 6 | Eventos asíncronos con RabbitMQ/Kafka | 🔜 |
| Fase 7 | API Gateway · Escalabilidad horizontal | 🔜 |

---

## 📞 Patrones y Buenas Prácticas Implementadas

- **Arquitectura Hexagonal** (Ports & Adapters)
- **SOLID** en toda la codebase
- **Clean Code** — nombres expresivos, funciones pequeñas
- **DTO Pattern** — separación entre capas
- **Repository Pattern** — dominio desacoplado de JPA
- **Strategy/Builder Pattern** — en servicios de dominio
- **Global Exception Handler** — respuestas de error consistentes
- **Soft Delete** — datos nunca se borran físicamente
- **Auditoría** — tracking de creación y modificación
- **JWT stateless** — sin sesiones en servidor
- **Input Validation** — Jakarta Validation en todos los DTOs
- **Geospatial Search** — PostGIS para búsquedas por radio
