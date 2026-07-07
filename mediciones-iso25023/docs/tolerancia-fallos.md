# Tolerancia a fallos — ISO/IEC 25023, Tabla 17

Característica: **Fiabilidad → Tolerancia a fallos**. Grado en que el sistema
opera según lo previsto a pesar de la presencia de fallos de hardware o software.

La base técnica en este sistema es el `GlobalExceptionHandler`
(`infrastructure/web/exception`): toda condición de error conocida se traduce en
una respuesta HTTP controlada con el envelope `ApiResponse`
(`success=false`, `message`, `errorCode`), en lugar de propagar la excepción y
tumbar la petición con un 500 sin formato.

Script que automatiza la medición: `../scripts/medir-tolerancia-fallos.ps1`
Salidas: `../resultados/tolerancia_fallos_casos.csv`,
`../resultados/tolerancia_fallos_componentes.csv` y
`../resultados/tolerancia_fallos_resumen.csv`

---

## RFt-1-G — Evitación de fallos

**Pregunta:** ¿Qué proporción de patrones de fallo se ha controlado para evitar
fallos críticos y graves?

**Fórmula:** `X = A / B`
- **A** = Número de fallos críticos y graves evitados (basado en casos de prueba)
- **B** = Número de casos de prueba de patrón de fallo ("casi provocando fallos") ejecutados

### Casos de prueba de patrón de fallo (B = 12)

Cada caso inyecta una entrada anómala que, sin control, produciría un fallo
grave (excepción no manejada, caída de la petición, fuga de stacktrace). El
fallo se considera **evitado** si el sistema responde con un estado HTTP
controlado **4xx** (nunca 5xx ni desconexión) y sigue operativo después.

| # | Caso (patrón de fallo) | Petición inyectada | Respuesta controlada esperada |
|---|---|---|---|
| 1 | JSON malformado | `POST /v1/auth/login` con cuerpo `{invalid...` | 400 |
| 2 | Violación de validación | Login con email inválido y password vacío | 400 con errores por campo |
| 3 | Credenciales incorrectas | Login con password errónea | 401 con `errorCode` |
| 4 | Recurso inexistente | `GET /v1/restaurants/{uuid aleatorio}` | 404 con envelope |
| 5 | Identificador con tipo inválido | `GET /v1/restaurants/no-es-uuid` | 400 |
| 6 | Ruta inexistente | `GET /v1/ruta-que-no-existe` | 401/404 (nunca 500) |
| 7 | Acceso sin autenticación | `GET /v1/integration/restaurants` sin token | 401/403 |
| 8 | Token corrupto | Mismo endpoint con `Authorization: Bearer basura` | 401 |
| 9 | Método HTTP no soportado | `DELETE /v1/auth/login` | 405/401 |
| 10 | Content-Type incorrecto | Login enviado como `text/plain` | 415 |
| 11 | Parámetro fuera de rango | `GET /v1/restaurants?page=-1` | 4xx (si responde 500, el fallo NO fue evitado) |
| 12 | Cuerpo vacío en endpoint que lo requiere | `POST /v1/auth/login` sin cuerpo | 400 |

El script registra por caso: estado HTTP, si el cuerpo es JSON válido con
envelope, la latencia, y el veredicto `EVITADO` / `NO_EVITADO`. Al final ejecuta
un healthcheck para constatar que el sistema sigue `UP` tras la batería
(evidencia de que ningún caso lo tumbó).

---

## RFt-2-S — Redundancia de componentes

**Pregunta:** ¿Qué proporción de componentes del sistema se instala de forma
redundante para evitar fallos del sistema?

**Fórmula:** `X = A / B`
- **A** = Número de componentes instalados de forma redundante
- **B** = Número de componentes del sistema

### Inventario de componentes (entorno local Docker Compose)

| Componente | Instancias locales | Redundante local | Redundancia en producción |
|---|---|---|---|
| `postgres` (PostGIS) | 1 | NO | Neon: almacenamiento replicado gestionado |
| `backend` (Spring Boot) | 1 | NO | Render free: 1 instancia |
| `frontend` (Next.js) | 1 | NO | Vercel: edge/CDN multi-nodo gestionado |
| `adminer` (solo dev) | 1 | NO | No se despliega |

El script obtiene la lista real con `docker compose config --services` y cuenta
las réplicas en ejecución (`docker compose ps`). En el entorno local A = 0 y
X = 0 — es el valor honesto para un despliegue de una sola instancia; el
mecanismo compensatorio es `restart: unless-stopped` (recuperación automática,
que mejora disponibilidad pero **no** es redundancia).

Para reportar el entorno de producción, edita la columna `redundante` en
`tolerancia_fallos_componentes.csv` según la tabla anterior y recalcula X en el
Excel (con Vercel y Neon como redundantes gestionados: A = 2, B = 3, X ≈ 0.67).

---

## RFt-3-S — Tiempo medio de notificación de fallo

**Pregunta:** ¿Con qué rapidez informa el sistema sobre la aparición de fallos?

**Fórmula:** `X = Σ (Ai − Bi) / n`
- **Ai** = Instante en que el sistema reporta el fallo i
- **Bi** = Instante en que se detecta (inyecta) el fallo i
- **n** = Número de fallos detectados

Cuanto más cerca de 0, mejor.

### Interpretación en este sistema

Para cada caso de patrón de fallo de RFt-1-G:
- **Bi** = timestamp en que el script envía la petición anómala (el fallo entra al sistema).
- **Ai** = timestamp en que el sistema devuelve la respuesta de error con su
  `errorCode` (el sistema **reporta** el fallo al consumidor).
- `Ai − Bi` = latencia de notificación del fallo, en segundos.

El script promedia las latencias de los n casos ejecutados y lo reporta como X
(típicamente < 0.5 s, porque la notificación es síncrona vía HTTP).

**Medición complementaria (a nivel infraestructura, manual):** tiempo entre
`docker stop restaurants-backend` (Bi) y el primer `docker ps` que muestre el
contenedor `unhealthy`/caído o la primera muestra `NO_DISPONIBLE` del monitoreo
de disponibilidad (Ai). Con el healthcheck de Compose configurado a
`interval: 30s`, ese tiempo de notificación es ≤ 30 s. Puedes anotar esta
segunda serie en el Excel como "notificación a nivel de plataforma".

---

## Procedimiento de medición

1. Levantar el stack: `docker compose up -d`.
2. Ejecutar:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-tolerancia-fallos.ps1
   ```
3. Revisar `resultados/tolerancia_fallos_resumen.csv`: RFt-1-G y RFt-2-S con
   A, B y X; RFt-3-S con n, la suma de latencias y X en segundos.
4. El detalle caso por caso queda en `resultados/tolerancia_fallos_casos.csv` y
   el inventario de componentes en `resultados/tolerancia_fallos_componentes.csv`.

**Parámetros opcionales:** `-BaseUrl`, `-ComposeDir` (raíz del repo, para leer
los servicios de Docker Compose).
