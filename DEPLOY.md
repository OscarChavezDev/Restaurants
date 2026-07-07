# Despliegue gratuito — Neon + Render + Vercel

Guía paso a paso para desplegar el sistema completo **sin pagar nada**:

| Pieza | Servicio | Plan |
|-------|----------|------|
| PostgreSQL + PostGIS | [Neon](https://neon.tech) | Free (sin tarjeta) |
| Backend Spring Boot | [Render](https://render.com) | Free (sin tarjeta) |
| Frontend Next.js | [Vercel](https://vercel.com) | Hobby (sin tarjeta) |

## URLs del despliegue actual

| Pieza | URL |
|-------|-----|
| API (Render) | <https://restaurants-backend-ni6d.onrender.com/api> |
| Swagger | <https://restaurants-backend-ni6d.onrender.com/api/swagger-ui/index.html> |
| Health | <https://restaurants-backend-ni6d.onrender.com/api/actuator/health> |
| Frontend (Vercel) | <https://restaurants-seven-tan.vercel.app> |

> Requisito: el repo debe estar en GitHub y la rama a desplegar pusheada
> (Render y Vercel se conectan a una rama del repo).

---

## 1. Base de datos en Neon

1. Crea una cuenta en <https://neon.tech> y un proyecto (región `AWS us-east-2`
   o la más cercana). El proyecto trae una base `neondb` con un usuario owner.
2. En el dashboard, botón **Connect** → copia los datos de conexión:
   - Host: `ep-xxxx-xxxx.us-east-2.aws.neon.tech`
   - Database: `neondb` · User: `neondb_owner` · Password: `...`
3. **No necesitas crear tablas ni extensiones a mano**: Flyway aplica todas las
   migraciones (V1…Vn) al primer arranque del backend, y el callback
   `beforeMigrate__extensions.sql` crea `postgis` y `uuid-ossp` automáticamente.

El `DB_URL` para el backend se arma en formato **JDBC** (no es el string
`postgresql://` que muestra Neon):

```
jdbc:postgresql://ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 2. Backend en Render

### Opción A — Blueprint (recomendada)

1. En <https://dashboard.render.com>: **New → Blueprint** → conecta el repo de
   GitHub y elige la rama a desplegar. Render lee el [`render.yaml`](render.yaml)
   de la raíz.
2. Te pedirá los valores marcados `sync: false`:

   | Variable | Valor |
   |----------|-------|
   | `DB_URL` | el JDBC de Neon (arriba) |
   | `DB_USERNAME` / `DB_PASSWORD` | usuario/clave de Neon |
   | `CORS_ALLOWED_ORIGINS` | `https://tu-app.vercel.app` (lo tendrás en el paso 3; pon un placeholder y edítalo después) |
   | `FRONTEND_URL` | el mismo dominio de Vercel (para los enlaces de los correos) |
   | `MAIL_USERNAME` / `MAIL_PASSWORD` | Gmail + contraseña de aplicación (opcional) |
   | `GOOGLE_CLIENT_ID` | OAuth Client ID de Google (opcional) |
   | `CLOUDINARY_*` | credenciales de Cloudinary (opcional) |
   | `GEMINI_API_KEY` | API key de AI Studio (opcional) |

3. **Apply**. El primer build tarda ~10 min (Maven + Docker). Al arrancar verás
   en los logs a Flyway aplicando las migraciones contra Neon.
4. Tu API queda en `https://restaurants-backend-xxxx.onrender.com/api`.
   Verifica: `https://.../api/actuator/health` debe responder `{"status":"UP"}`
   y `https://.../api/swagger-ui.html` debe cargar.

### Opción B — Manual (sin blueprint)

**New → Web Service** → repo → Runtime **Docker** →
**Root Directory: `restaurants-backend`** → Instance Type **Free** →
Health Check Path `/api/actuator/health` → y agrega a mano las mismas
variables de entorno del `render.yaml` (con `SPRING_PROFILES_ACTIVE=prod`).

---

## 3. Frontend en Vercel

1. En <https://vercel.com>: **Add New → Project** → importa el repo.
2. **Root Directory: `restaurants-frontend`** (detecta Next.js solo).
   En Settings → Git puedes cambiar la *Production Branch* si no despliegas `main`.
3. Environment Variables (son de **build**: si las cambias, redeploy):

   | Variable | Valor |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://restaurants-backend-xxxx.onrender.com/api` |
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
https://restaurants-backend-xxxx.onrender.com/api/actuator/health
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
