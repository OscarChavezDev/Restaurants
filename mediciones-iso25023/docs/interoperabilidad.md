# Interoperabilidad — ISO/IEC 25023, Tabla 8

Característica: **Compatibilidad → Interoperabilidad**. Grado en que el sistema
puede intercambiar información con otros sistemas y usar la información
intercambiada. En este proyecto, los "otros sistemas" son los del ecosistema
turístico de Tingo María (Eventos, Hoteles, Turismo, Transporte), que consumen
la API a través de `/v1/integration/**`.

Script que automatiza la medición: `../scripts/medir-interoperabilidad.ps1`
Salidas: `../resultados/interoperabilidad_detalle.csv` y `../resultados/interoperabilidad_resumen.csv`

---

## CIn-1-G — Intercambiabilidad de formatos de datos

**Pregunta:** ¿Qué proporción de los formatos de datos especificados es
intercambiable con otro software o sistema?

**Fórmula:** `X = A / B`
- **A** = Número de formatos de datos intercambiables con otro software o sistemas (verificados)
- **B** = Número de formatos de datos especificados como intercambiables

### Formatos especificados en este sistema (B = 3)

| # | Formato | Especificación | Cómo se verifica (caso de prueba) |
|---|---|---|---|
| 1 | JSON con envelope `ApiResponse` | Todo endpoint devuelve `{ success, message, data, errorCode, timestamp }` | `GET /v1/restaurants` responde JSON válido con los campos `success` y `data` |
| 2 | OpenAPI 3 (JSON) | Contrato de la API publicado en `/v3/api-docs` | La respuesta es JSON válido con el campo `openapi` (versión 3.x) |
| 3 | JWT (RFC 7519) | Token de autenticación emitido en el login, consumible por sistemas externos | El `accessToken` del login tiene estructura `header.payload.signature` (3 segmentos Base64) |

**Interpretación:** X = 1.0 significa que el 100 % de los formatos declarados como
intercambiables funcionan de verdad al ser consumidos por un cliente externo
(el script actúa como ese cliente).

---

## CIn-2-G — Suficiencia del protocolo de intercambio de datos

**Pregunta:** ¿Qué proporción de los protocolos de intercambio de datos
especificados está soportada?

**Fórmula:** `X = A / B`
- **A** = Número de protocolos de intercambio de datos soportados (verificados)
- **B** = Número de protocolos especificados para ser soportados

### Protocolos especificados en este sistema (B = 3)

| # | Protocolo | Especificación | Cómo se verifica (caso de prueba) |
|---|---|---|---|
| 1 | HTTP/1.1 (REST) | API REST sobre HTTP en `:8080/api` | `GET /v1/restaurants` responde con estado 200 |
| 2 | Autenticación Bearer JWT (RFC 6750) | Cabecera `Authorization: Bearer <token>` habilita endpoints protegidos | `GET /v1/integration/restaurants` con token de admin responde 200; sin token responde 401/403 |
| 3 | CORS (preflight) | Origen `http://localhost:3000` permitido en `SecurityConfig` | `OPTIONS` con `Origin` y `Access-Control-Request-Method` devuelve `Access-Control-Allow-Origin` |

> Nota: en producción (Render/Vercel) se agrega HTTPS/TLS. Para medirlo en ese
> entorno ejecuta el script con `-BaseUrl "https://<servicio>.onrender.com/api"`
> y documenta HTTPS como cuarto protocolo (B = 4).

---

## CIn-3-S — Adecuación de interfaces externas

**Pregunta:** ¿Qué proporción de las interfaces externas especificadas
(interfaces con otros programas y sistemas) es funcional?

**Fórmula:** `X = A / B`
- **A** = Número de interfaces externas que son funcionales
- **B** = Número de interfaces externas especificadas

### Interfaces externas especificadas (B = 3)

Son los endpoints de `IntegrationController` (`/v1/integration/**`), la
superficie oficial que consumen los demás sistemas del ecosistema:

| # | Interfaz | Sistema consumidor | Caso de prueba (funcional = responde 200 con envelope JSON) |
|---|---|---|---|
| 1 | `GET /v1/integration/restaurants` | Turismo / Transporte | Catálogo paginado de restaurantes activos |
| 2 | `GET /v1/integration/restaurants/{id}/availability` | Hoteles | Disponibilidad de un restaurante existente (id tomado del catálogo público) |
| 3 | `GET /v1/integration/restaurants/near-event/{eventId}` | Eventos | Restaurantes cercanos a un evento (responde 200 con lista, hoy vacía) |

---

## Procedimiento de medición

1. Levantar el stack: `docker compose up -d` (esperar al healthcheck del backend, ~60 s).
2. Ejecutar:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-interoperabilidad.ps1
   ```
3. Revisar `resultados/interoperabilidad_resumen.csv`: contiene una fila por
   medida (CIn-1-G, CIn-2-G, CIn-3-S) con A, B y X calculados.
4. El detalle por ítem (con evidencia: estado HTTP, validez del JSON) queda en
   `resultados/interoperabilidad_detalle.csv`.

**Parámetros opcionales:** `-BaseUrl`, `-AdminEmail`, `-AdminPassword`.
