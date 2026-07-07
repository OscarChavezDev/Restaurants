# Metodología e instrumentos de medición

Registro de **cómo** se ejecutaron las mediciones ISO/IEC 25023: herramientas,
entornos, procedimiento de verificación y decisiones tomadas. Esto es parte de
la evidencia del informe (reproducibilidad).

## Herramientas utilizadas

| Herramienta | Versión / detalle | Para qué se usó |
|---|---|---|
| **Windows PowerShell 5.1** | Incluido en Windows 11 | Motor de los 3 scripts de medición (`scripts/*.ps1`) |
| **Invoke-WebRequest** | Cmdlet nativo de PowerShell | Cliente HTTP de todas las pruebas: actúa como "sistema externo" que consume la API. Captura estado HTTP, cuerpo y cabeceras incluso en respuestas 4xx/5xx |
| **System.Diagnostics.Stopwatch** | .NET | Medición de latencias en milisegundos (RFt-3-S: Ai − Bi; latencia de cada muestra de disponibilidad) |
| **Docker Desktop / Docker Compose** | Stack local (`docker-compose.yml`) | Levantar el sistema bajo prueba; **inyección de la avería controlada** (`docker stop` / `docker start restaurants-backend`); inventario de componentes para RFt-2-S (`docker compose config --services`, `docker compose ps -q`) |
| **Spring Boot Actuator** | `/actuator/health` (público) | Sonda de disponibilidad (RAv-1-G, RAv-2-G) y verificación "sistema sigue UP" tras la batería de fallos (RFt-1-G) |
| **OpenAPI / Swagger** | `/v3/api-docs` | Verificación del formato de contrato intercambiable (CIn-1-G) |
| **Export-Csv (UTF-8)** | Cmdlet nativo | Generación de los CSV de `resultados/` que alimentan el Excel |

No se instaló ninguna herramienta externa (JMeter, Postman, etc.): todo corre
con lo que trae Windows + Docker, para que cualquiera del equipo lo reproduzca
con `powershell -ExecutionPolicy Bypass -File <script>`.

## Entornos medidos

| Entorno | URL base | Qué se midió ahí |
|---|---|---|
| **Local (Docker Compose)** | `http://localhost:8080/api` | Interoperabilidad (CIn-1/2/3), Tolerancia a fallos (RFt-1/2/3), Disponibilidad con avería controlada (RAv-1/2) |
| **Producción (Render free)** | `https://restaurants-backend-ni6d.onrender.com/api` | Disponibilidad en operación real (RAv-1-G; archivos `*_prod.csv`) — sin avería provocada, no se sabotea producción |

Fecha de las mediciones registradas: **2026-07-04** (columna `fecha` de cada CSV).

## Cómo se obtuvo cada dato (A y B)

- **CIn-1-G / CIn-2-G / CIn-3-S**: el script hace de cliente externo real: login
  JWT (`POST /v1/auth/login` con la cuenta admin seed), consumo de los 3
  endpoints `/v1/integration/**`, descarga del contrato OpenAPI y preflight
  CORS. Cada ítem cuenta para A solo si la respuesta cumple el criterio
  documentado en `docs/interoperabilidad.md` (estado esperado + JSON válido +
  campos del envelope). B es la cantidad de ítems especificados (3 por medida).
- **RAv-1-G / RAv-2-G**: muestreo del health cada 5 s durante la ventana
  (`disponibilidad_muestras*.csv` guarda cada muestra con timestamp, estado y
  latencia — se escribe incrementalmente para no perder datos si algo se
  corta). A y B se derivan contando muestras UP/DOWN × intervalo. La avería
  local se inyectó con `docker stop restaurants-backend` (25 s) + `docker start`;
  el tiempo de rearranque de Spring (~15 s) cuenta como inactividad.
- **RFt-1-G**: 12 casos de patrón de fallo (tabla en
  `docs/tolerancia-fallos.md`) inyectados por HTTP; "evitado" = respuesta
  controlada 4xx con envelope, nunca 5xx. Tras la batería se verifica con el
  health que el servicio sigue UP.
- **RFt-2-S**: inventario real de servicios y réplicas vía Docker Compose.
- **RFt-3-S**: para cada caso de RFt-1-G, Bi = timestamp de envío de la
  petición anómala, Ai = timestamp de la respuesta de error; X = promedio de
  (Ai − Bi) medido con Stopwatch.

## Verificaciones y hallazgos durante la puesta a punto

Estas comprobaciones se hicieron al validar los scripts contra el sistema real
(no son teóricas) y quedaron incorporadas:

1. **Hallazgo real de RFt-1-G**: la primera corrida dio X = 0.5 — seis patrones
   de fallo (JSON malformado, UUID inválido, método no soportado, Content-Type
   incorrecto, `page=-1`, cuerpo vacío) devolvían **500** porque caían en el
   handler genérico. Se corrigió agregando 6 `@ExceptionHandler` específicos a
   `GlobalExceptionHandler` (códigos `MALFORMED_BODY`, `INVALID_PARAMETER_TYPE`,
   `MISSING_PARAMETER`, `METHOD_NOT_ALLOWED`, `UNSUPPORTED_MEDIA_TYPE`,
   `INVALID_ARGUMENT`), se reconstruyó la imagen (`docker compose up --build
   backend -d`) y la re-medición dio X = 1.0. **Esto es evidencia de que la
   medición sirve**: detectó una deficiencia y guió la mejora.
2. El endpoint `GET /v1/integration/restaurants/near-event/{id}` devolvía 500
   con un path inválido durante la depuración del script — el fallo era del
   script (interpolación de PowerShell), no del sistema; corregido, la interfaz
   respondió 200 y CIn-3-S quedó en 1.0.
3. El health de Actuator responde con content-type
   `application/vnd.spring-boot.actuator.v3+json`, que PowerShell entrega como
   bytes; los scripts lo decodifican a UTF-8 antes de evaluar `status=UP`
   (sin esto, todas las muestras se marcaban DOWN con HTTP 200).
4. La validación local de disponibilidad reprodujo el escenario completo:
   48 muestras, 1 fallo detectado, RAv-1-G = 0.8333, RAv-2-G = 40 s/fallo —
   consistente con los 25 s de parada + ~15 s de arranque de Spring.

## Limitaciones conocidas

- La resolución temporal de la disponibilidad es el intervalo de muestreo (±5 s).
- RFt-2-S en local da 0 (una instancia por servicio); el valor de producción se
  reporta aparte según la tabla de `docs/tolerancia-fallos.md` (Neon y Vercel
  aportan redundancia gestionada; Render free no).
- En Render free el servicio puede dormirse por inactividad: si la ventana de
  medición lo despierta, las primeras muestras reflejan ese arranque en frío
  (restricción del plan, documentarla junto al resultado).
