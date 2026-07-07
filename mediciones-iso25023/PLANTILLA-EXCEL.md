# Plantilla del Excel de mediciones ISO/IEC 25023

Guía para construir el libro Excel a partir de los CSV de `resultados/`.
(Pensada para dársela a un asistente/Cowork: "lee `mediciones-iso25023/resultados/`
y arma el libro según `PLANTILLA-EXCEL.md`".)

## Hoja 1 — "Resumen" (la principal)

Una fila por medida, tomada de los tres `*_resumen.csv`:

| Columna | Origen |
|---|---|
| Característica | Interoperabilidad / Disponibilidad / Tolerancia a fallos |
| ID | `id` del CSV (CIn-1-G, CIn-2-G, CIn-3-S, RAv-1-G, RAv-2-G, RFt-1-G, RFt-2-S, RFt-3-S) |
| Nombre de la medida | `nombre` |
| Función de medición | `X = A/B` (RAv-2-G en s/fallo; RFt-3-S = Σ(Ai−Bi)/n en s) |
| A | `A` (o `A_seg`) |
| B | `B` (o `B_seg`) |
| X (valor medido) | `X` — en Excel usar fórmula `=A/B` para que quede viva |
| Interpretación | `interpretacion` |
| Fecha de medición | `fecha` |
| Entorno | `entorno` (local o URL de producción) |

Formato sugerido: semáforo condicional sobre X — para las medidas de proporción
(todas menos RAv-2-G y RFt-3-S): verde ≥ 0.9, amarillo ≥ 0.7, rojo < 0.7.
Para RAv-2-G y RFt-3-S (menor = mejor): verde ≤ 60 s / ≤ 1 s respectivamente.

## Hoja 2 — "Interoperabilidad (detalle)"

Pegar `interoperabilidad_detalle.csv` tal cual (columnas: medida, item, prueba,
estado_http, resultado, evidencia). Agrupar visualmente por `medida`.

## Hoja 3 — "Disponibilidad (muestras)"

Pegar `disponibilidad_muestras.csv` (local) y `disponibilidad_muestras_prod.csv`
(despliegue en Render) — una tabla por entorno, o una sola con columna Entorno.
En "Resumen" van las filas de ambos `disponibilidad_resumen*.csv` (la columna
`entorno` las distingue). Sugerencias:
- Gráfico de línea o de pasos: tiempo (timestamp) vs estado (DISPONIBLE=1,
  NO_DISPONIBLE=0) — se ve la ventana de caída.
- Celdas calculadas: total de muestras, muestras UP, muestras DOWN,
  `%disponibilidad = UP/total` (debe coincidir con X de RAv-1-G).

## Hoja 4 — "Tolerancia a fallos (casos)"

Pegar `tolerancia_fallos_casos.csv` (caso, patron_de_fallo, peticion,
estado_http, respuesta_json, veredicto, Bi_inyeccion, latencia_notificacion_s).
- Conteo: `=CONTAR.SI(veredicto,"EVITADO")` → A de RFt-1-G.
- Promedio: `=PROMEDIO(latencia_notificacion_s)` → X de RFt-3-S.

## Hoja 5 — "Componentes (redundancia)"

Pegar `tolerancia_fallos_componentes.csv`. Añadir dos columnas manuales para el
escenario de producción (`redundante_prod`, según docs/tolerancia-fallos.md) y
recalcular X de RFt-2-S para ambos entornos.

## Notas

- Los CSV están en UTF-8, separados por coma; en Excel usar
  Datos → Obtener datos → Desde texto/CSV.
- Si se midió más de un entorno (local y Render), duplicar la fila de la medida
  en "Resumen" con su columna Entorno, no sobrescribir.
- Los criterios de decisión (qué cuenta como "intercambiable", "funcional",
  "evitado") están definidos en `docs/*.md` — citarlos en el informe.
