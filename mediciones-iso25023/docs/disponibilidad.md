# Disponibilidad — ISO/IEC 25023, Tabla 16

Característica: **Fiabilidad → Disponibilidad**. Grado en que el sistema está
operativo y accesible cuando se requiere su uso.

La medición se apoya en **Spring Boot Actuator**: `GET /actuator/health` es
público (`SecurityConfig` lo permite sin autenticación) y devuelve
`{"status":"UP"}` cuando el backend y su conexión a la base de datos están
operativos. El script monitorea ese endpoint a intervalos regulares y registra
cada muestra.

Script que automatiza la medición: `../scripts/medir-disponibilidad.ps1`
Salidas: `../resultados/disponibilidad_muestras.csv` y `../resultados/disponibilidad_resumen.csv`

---

## RAv-1-G — Disponibilidad del sistema

**Pregunta:** ¿Durante qué proporción del tiempo operativo programado el sistema
está realmente disponible?

**Fórmula:** `X = A / B`
- **A** = Tiempo de operación del sistema realmente proporcionado
- **B** = Tiempo de operación especificado en el calendario de operaciones

### Interpretación en este sistema

- **B (tiempo programado)** = duración de la ventana de observación del
  monitoreo (parámetro `-DuracionMinutos`, por defecto 10 minutos). El sistema
  se especifica como 24/7, así que toda la ventana cuenta como tiempo programado.
- **A (tiempo disponible)** = suma del tiempo en que las muestras del
  healthcheck devolvieron `UP` (número de muestras UP × intervalo de muestreo).
- **X** cercano a 1.0 = mejor. Con la ventana de 10 min y una caída provocada de
  ~30 s, lo esperable es X ≈ 0.95.

---

## RAv-2-G — Tiempo medio de inactividad

**Pregunta:** ¿Cuánto tiempo permanece el sistema indisponible cuando ocurre una
avería?

**Fórmula:** `X = A / B`
- **A** = Tiempo total de inactividad (suma de la duración de todos los episodios DOWN)
- **B** = Número de fallos observados (episodios DOWN consecutivos cuentan como un fallo)

Cuanto más pequeño, mejor (va de 0 a infinito). Si durante la ventana no se
observa ningún fallo, el script reporta `N/A` (no hay denominador) — por eso el
procedimiento incluye **provocar una avería controlada**.

---

## Procedimiento de medición

1. Levantar el stack: `docker compose up -d`.
2. En una terminal, iniciar el monitoreo (ventana de 10 min, muestra cada 5 s):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mediciones-iso25023\scripts\medir-disponibilidad.ps1 -DuracionMinutos 10 -IntervaloSegundos 5
   ```
3. **Avería controlada** (para que RAv-2-G tenga datos): pasados ~3 minutos de
   monitoreo, en OTRA terminal:
   ```powershell
   docker stop restaurants-backend
   # esperar unos 30-60 segundos
   docker start restaurants-backend
   ```
   El backend tarda ~30-60 s adicionales en volver a `UP` (arranque de Spring).
   Todo ese tiempo cuenta como inactividad del fallo.
4. Al terminar la ventana, el script imprime y guarda:
   - `disponibilidad_muestras.csv`: una fila por muestra
     (`timestamp, estado, http_status, latencia_ms`).
   - `disponibilidad_resumen.csv`: RAv-1-G (A, B en segundos y X) y RAv-2-G
     (A = segundos totales de inactividad, B = número de fallos, X = segundos
     promedio por fallo).

**Parámetros:** `-BaseUrl` (por defecto `http://localhost:8080/api`),
`-DuracionMinutos`, `-IntervaloSegundos`.

### Notas metodológicas

- La resolución de la medida es el intervalo de muestreo: con 5 s, una caída se
  mide con un error máximo de ±5 s. Para mayor precisión usa
  `-IntervaloSegundos 2`.
- La NOTA 2 de la tabla aplica aquí: la disponibilidad combina madurez
  (frecuencia de fallos), tolerancia a fallos y recuperabilidad (Docker
  `restart: unless-stopped` reinicia el contenedor automáticamente si el proceso
  muere, lo que acorta el tiempo de inactividad).
- Para medir el entorno de producción, ejecutar con
  `-BaseUrl "https://<servicio>.onrender.com/api"` (ojo: el plan gratuito de
  Render duerme el servicio por inactividad; documentar eso como restricción del
  calendario de operaciones si aparece en los datos).
