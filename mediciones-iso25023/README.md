# Mediciones de calidad ISO/IEC 25023 — Sistema de Restaurantes

Paquete autocontenido para **medir** tres características de calidad del producto
(ISO/IEC 25010 / 25023) sobre el Sistema de Restaurantes de Tingo María:

| Característica | Medidas (ISO/IEC 25023) | Documento | Script |
|---|---|---|---|
| **Compatibilidad → Interoperabilidad** (Tabla 8) | CIn-1-G, CIn-2-G, CIn-3-S | [docs/interoperabilidad.md](docs/interoperabilidad.md) | `scripts/medir-interoperabilidad.ps1` |
| **Fiabilidad → Disponibilidad** (Tabla 16) | RAv-1-G, RAv-2-G | [docs/disponibilidad.md](docs/disponibilidad.md) | `scripts/medir-disponibilidad.ps1` |
| **Fiabilidad → Tolerancia a fallos** (Tabla 17) | RFt-1-G, RFt-2-S, RFt-3-S | [docs/tolerancia-fallos.md](docs/tolerancia-fallos.md) | `scripts/medir-tolerancia-fallos.ps1` |

Todas las medidas usan la forma **X = A / B** (salvo RAv-2-G y RFt-3-S, que son
tiempos promedio). Cada script calcula A, B y X automáticamente y deja los
resultados en `resultados/*.csv`, listos para volcarse a Excel
(ver [PLANTILLA-EXCEL.md](PLANTILLA-EXCEL.md)).

Las herramientas, entornos, criterios y hallazgos de la ejecución están
documentados en [METODOLOGIA.md](METODOLOGIA.md) — citarlo como evidencia de
reproducibilidad en el informe.

## Requisitos

- Stack corriendo con Docker Compose desde la raíz del repo:

  ```powershell
  docker compose up -d
  ```

- PowerShell 5.1+ (viene con Windows). Los scripts no requieren módulos extra.
- Credenciales admin del seed (por defecto `admin@tingo-restaurants.com` / `Admin@1234!`).

## Ejecución rápida (las 3 mediciones)

Desde la raíz del repo:

```powershell
# 1. Interoperabilidad (~30 segundos)
powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-interoperabilidad.ps1

# 2. Tolerancia a fallos (~1 minuto)
powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-tolerancia-fallos.ps1

# 3. Disponibilidad (monitoreo: por defecto 10 min muestreando cada 5 s)
powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-disponibilidad.ps1 -DuracionMinutos 10 -IntervaloSegundos 5
```

> Para que RAv-2-G (tiempo medio de inactividad) tenga datos reales, durante el
> monitoreo de disponibilidad provoca al menos una caída controlada en otra
> terminal: `docker stop restaurants-backend`, espera ~30 s y luego
> `docker start restaurants-backend`. El procedimiento completo está en
> [docs/disponibilidad.md](docs/disponibilidad.md).

## Archivos de salida (en `resultados/`)

| Archivo | Contenido |
|---|---|
| `interoperabilidad_detalle.csv` | Cada formato/protocolo/interfaz probado, con evidencia |
| `interoperabilidad_resumen.csv` | CIn-1-G, CIn-2-G, CIn-3-S con A, B y X |
| `disponibilidad_muestras.csv` | Una fila por muestra del monitoreo local (timestamp, estado, latencia) |
| `disponibilidad_resumen.csv` | RAv-1-G y RAv-2-G con A, B y X (entorno local) |
| `disponibilidad_muestras_prod.csv` | Muestras del monitoreo contra el despliegue en Render |
| `disponibilidad_resumen_prod.csv` | RAv-1-G y RAv-2-G del entorno de producción |
| `tolerancia_fallos_casos.csv` | Cada caso de patrón de fallo ejecutado, con resultado |
| `tolerancia_fallos_componentes.csv` | Inventario de componentes y su redundancia (RFt-2-S) |
| `tolerancia_fallos_resumen.csv` | RFt-1-G, RFt-2-S, RFt-3-S con A, B y X |

Todos los scripts aceptan `-BaseUrl` para medir otro entorno. Para el
despliegue actual en Render (URLs en `DEPLOY.md`):

```powershell
powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-disponibilidad.ps1 `
    -BaseUrl "https://restaurants-backend-ni6d.onrender.com/api" -DuracionMinutos 10 -Sufijo "_prod"
```

El parámetro `-Sufijo` evita pisar los CSV de la medición local.

## Base técnica del sistema que habilita cada medición

- **Interoperabilidad:** endpoints de integración `/v1/integration/**`
  (`IntegrationController`, rol `SYSTEM_INTEGRATION`/`ADMIN`), contrato OpenAPI 3
  en `/v3/api-docs`, envelope JSON `ApiResponse`, autenticación JWT Bearer y CORS.
- **Disponibilidad:** Spring Boot Actuator (`/actuator/health`, público en
  `SecurityConfig`) + healthchecks de Docker Compose.
- **Tolerancia a fallos:** `GlobalExceptionHandler` (respuestas de error
  controladas con envelope y `errorCode`), validación Jakarta en DTOs,
  `restart: unless-stopped` en los contenedores.
