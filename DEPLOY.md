# Despliegue gratuito — Neon + Render + Vercel

Guía paso a paso para desplegar el sistema completo **sin pagar nada**:

| Pieza | Servicio | Plan |
|-------|----------|------|
| PostgreSQL + PostGIS | [Neon](https://neon.tech) | Free (sin tarjeta) |
| Backend Spring Boot | [Render](https://render.com) | Free (sin tarjeta) |
| Frontend Next.js | [Vercel](https://vercel.com) | Hobby (sin tarjeta) |

> **2026-07-20 — se probaron alternativas y se volvió a Render:** el despliegue
> anterior en Render falló y se exploraron otras plataformas. **Koyeb** ya no
> permite crear servicios nuevos (su panel solo muestra "Settings"/"Log out" —
> quedó así tras anunciar que la empresa se une a Mistral AI y gira hacia
> cargas de trabajo "agentic", no hosting general). **Northflank** sí funciona
> y no pide tarjeta al registrarte, pero exige verificar una tarjeta (con
> autorización de $0, no cobro real) antes de poder crear el servicio — se
> descartó por eso. Conclusión: **Render sigue siendo la única opción 100 %
> sin tarjeta en ningún punto del flujo**; el problema del primer intento no
> era la plataforma en sí. Esta vez el servicio se creó a mano (Opción B de
> abajo, no vía blueprint) con la región emparejada a la de Neon (`us-east`) y
> la lista completa de variables de entorno.

## URLs del despliegue actual

| Pieza | URL |
|-------|-----|
| API (Render) | _pendiente — confirmar tras el primer deploy, ej. `https://restaurants-xxxx.onrender.com/api`_ |
| Swagger | `<URL de arriba>/swagger-ui/index.html` |
| Health | `<URL de arriba>/actuator/health` |
| Frontend (Vercel) | <https://restaurants-seven-tan.vercel.app> |

> Requisito: el repo debe estar en GitHub y la rama a desplegar pusheada
> (Render y Vercel se conectan a una rama del repo).

---

## 1. Base de datos en Neon

1. Crea una cuenta en <https://neon.tech> y un proyecto (región `AWS us-east-2`
   o la más cercana). El proyecto trae una base `neondb` con un usuario owner.
2. En el dashboard, botón **Connect** → copia los datos de conexión:
   - Host: `ep-xxxx-xxxx.us-east-1.aws.neon.tech`
   - Database: `neondb` · User: `neondb_owner` · Password: `...`
3. **No necesitas crear tablas ni extensiones a mano**: Flyway aplica todas las
   migraciones (V1…Vn) al primer arranque del backend, y el callback
   `beforeMigrate__extensions.sql` crea `postgis` y `uuid-ossp` automáticamente.

El `DB_URL` para el backend se arma en formato **JDBC** (no es el string
`postgresql://` que muestra Neon):

```
jdbc:postgresql://ep-xxxx-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 2. Backend en Render

### Opción A — Blueprint

1. En <https://dashboard.render.com>: **New → Blueprint** → conecta el repo de
   GitHub y elige la rama a desplegar. Render lee el [`render.yaml`](render.yaml)
   de la raíz.
2. Te pedirá los valores marcados `sync: false` (ver tabla de variables abajo).
3. **Apply**. El primer build tarda ~10 min (Maven + Docker).

### Opción B — Manual (la usada en el despliegue actual)

1. **New → Web Service** → conecta el repo de GitHub → elige la rama (`main`).
2. Configuración:
   - **Name:** el que quieras (ej. `restaurants-backend`).
   - **Language/Runtime:** **Docker** (Render lo detecta solo si hay Dockerfile).
   - **Region:** la más cercana a tu proyecto de Neon (si Neon está en
     `us-east-1`, elige **Ohio** o **Virginia (US East)** en Render) — reduce
     mucho la latencia de cada consulta a la BD.
   - **Root Directory:** `restaurants-backend` (el Dockerfile vive ahí, no en
     la raíz del repo — si no pones esto, el build falla porque no encuentra
     el Dockerfile).
   - **Instance Type:** **Free**.
   - **Health Check Path:** `/api/actuator/health`.
3. **Environment Variables** — pégalas todas de una vez con el botón
   **"Add from .env"** (o agrégalas a mano una por una):

   ```
   SPRING_PROFILES_ACTIVE=prod
   SERVER_PORT=8080
   TZ=America/Lima

   DB_URL=jdbc:postgresql://<host-de-neon>/neondb?sslmode=require
   DB_USERNAME=neondb_owner
   DB_PASSWORD=<tu-contraseña-de-neon>

   JWT_SECRET=<genera uno con: openssl rand -base64 48>
   JWT_EXPIRATION=86400000
   JWT_REFRESH_EXPIRATION=604800000

   CORS_ALLOWED_ORIGINS=https://tu-app.vercel.app
   FRONTEND_URL=https://tu-app.vercel.app

   GOOGLE_CLIENT_ID=...       # opcional, login con Google
   GEMINI_API_KEY=...         # opcional, asistente IA
   GEMINI_MODEL=gemini-2.5-flash-lite
   ACTIFY_API_KEY=...         # opcional, integración Actify
   ACTIFY_BASE_URL=https://actify.qd.je/api/v1
   HOSPY_API_KEY=...          # opcional, integración Hospy
   HOSPY_BASE_URL=https://hospy-api-wm7v5futiq-rj.a.run.app/api/v1
   MAIL_USERNAME=...          # opcional, correos de reserva
   MAIL_PASSWORD=...          # contraseña de aplicación de Gmail
   CLOUDINARY_CLOUD_NAME=...  # opcional, subida de imágenes
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   CLOUDINARY_FOLDER=tingo-restaurants
   ```

4. **Deploy Web Service**. El primer build tarda ~10 min (Maven + Docker). En
   los logs deberías ver a Flyway aplicando las migraciones contra Neon.
5. Tu API queda en `https://restaurants-xxxx.onrender.com/api`. Verifica:
   `.../api/actuator/health` debe responder `{"status":"UP"}` y
   `.../api/swagger-ui.html` debe cargar. Anota esta URL en la tabla de arriba.

---

## 3. Frontend en Vercel

1. En <https://vercel.com>: **Add New → Project** → importa el repo.
2. **Root Directory: `restaurants-frontend`** (detecta Next.js solo).
   En Settings → Git puedes cambiar la *Production Branch* si no despliegas `main`.
3. Environment Variables (son de **build**: si las cambias, redeploy):

   | Variable | Valor |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://restaurants-xxxx.onrender.com/api` |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | el mismo Client ID del backend (si usas login Google) |

4. **Deploy** → te da `https://tu-app.vercel.app`.

### Cerrar el círculo

1. En Render, actualiza `CORS_ALLOWED_ORIGINS` y `FRONTEND_URL` con el dominio
   real de Vercel (sin `/` final). Render redespliega solo al guardar.
2. Si usas login con Google: en Google Cloud Console → APIs & Services →
   Credentials → tu OAuth Client → **Authorized JavaScript origins** → agrega
   `https://tu-app.vercel.app`.

---

## 4. Mantener despierto el backend (opcional pero recomendado)

El plan free de Render **suspende el servicio tras 15 min sin tráfico** y
Spring Boot tarda ~1 min en despertar (además, dormido no corre el scheduler
de recordatorios de reserva).

Solución gratis: cuenta en <https://uptimerobot.com> (o cron-job.org) →
monitor HTTP cada 5–10 min a:

```
https://restaurants-xxxx.onrender.com/api/actuator/health
```

---

## Problemas comunes

- **`FATAL: SSL required` / timeouts a la BD** → falta `?sslmode=require` en `DB_URL`.
- **Error CORS en el navegador** → `CORS_ALLOWED_ORIGINS` no coincide exacto con
  el dominio de Vercel (revisa `https://` y que no haya `/` final).
- **El front llama a `localhost:8080`** → `NEXT_PUBLIC_API_URL` se fijó después
  del build; cámbiala y haz **Redeploy** en Vercel.
- **La app no arranca en Render y el log pide `JWT_SECRET`/`DB_PASSWORD`** →
  es el fail-fast del perfil `prod`: falta esa variable de entorno.
- **Primera petición tras un rato tarda ~1 min** → es el cold start del plan
  free (ver sección 4).
- **Render no encuentra el Dockerfile / falla el build** → confirma que
  **Root Directory** sea `restaurants-backend` (el Dockerfile vive ahí, no en
  la raíz del repo).
