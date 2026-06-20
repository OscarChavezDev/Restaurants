# Manual de Pruebas — Etapas 2 y 3

Guía completa paso a paso para verificar todas las funcionalidades
implementadas en las Etapas 2 (Sprints 5-8) y 3 (Sprints 9-12) del Sistema de
Restaurantes de Tingo María.

---

## Preparación del entorno

### Levantar el stack

```bash
docker compose up -d            # levanta todo el stack
# o tras cambios:
docker compose up --build backend -d
docker compose up --build frontend -d
```

### URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| Adminer | http://localhost:8888 |

### Variables de entorno requeridas

Verificar que el archivo `.env` tenga configuradas las siguientes variables
(ver `.env.example` como referencia):

| Variable | Necesaria para |
|----------|----------------|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Subida de imágenes (Sprint 5) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapas (Sprint 6) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login con Google (Sprint 9) |
| `GEMINI_API_KEY` | Asistente IA (Sprint 12). Obtener en https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | Modelo de IA (por defecto `gemini-2.5-flash-lite`) |

### Credenciales de prueba (seed)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@tingo-restaurants.com` | `Admin@1234!` |
| Dueño | `owner.<nombre>@tingomaria.com` | `Admin@1234!` |

### Tips de depuración

- Para repetir un onboarding del cliente:
  `localStorage.removeItem('onboarding_seen_<userId>')`
- Para repetir un onboarding del dueño:
  `localStorage.removeItem('owner_onboarding_seen_<userId>')`
- Para Google OAuth en desarrollo: configurar en Google Cloud el origen
  `http://localhost:3000`.

---

# ETAPA 2 — Calidad Visual y Experiencia Base

---

## P01 · Subida de imágenes a Cloudinary (Sprint 5)

### P01.1 · Subir foto de restaurante

1. Iniciar sesión como **dueño** (`owner.carbon@tingomaria.com`).
2. Ir a **Dashboard** → editar un restaurante.
3. En la sección de **Fotos**, hacer clic en "Subir imagen".
4. **Verificar:**
   - Aparece el widget de subida con zona de drag-and-drop.
   - Seleccionar una imagen → se muestra barra de progreso.
   - La imagen se sube a Cloudinary (no al servidor).
   - Al completar, la imagen aparece en la galería.
5. Hacer clic en la imagen → debe abrirse un **lightbox** (vista ampliada).
6. Hacer clic en eliminar → la imagen desaparece de la galería y del CDN.

**Resultado esperado:** Las imágenes se suben directamente a Cloudinary con
firma del backend. Se pueden ver en lightbox y eliminar.

### P01.2 · Imagen por plato del menú

1. Ir a **Dashboard** → **Menús**.
2. Editar un plato existente o crear uno nuevo.
3. En el campo de imagen, subir una foto del plato.
4. **Verificar:**
   - La imagen se sube a Cloudinary.
   - En la vista pública del restaurante (`/restaurants/<slug>`), el plato
     muestra su imagen.

**Resultado esperado:** Cada plato puede tener su propia imagen visible en
la vista pública.

---

## P02 · Mapas y geolocalización (Sprint 6)

### P02.1 · Mapa en dashboard del dueño

1. Como **dueño**, ir a **Dashboard** → editar un restaurante.
2. En la sección de **Ubicación**, debe aparecer un mapa interactivo.
3. Hacer clic en un punto del mapa.
4. **Verificar:**
   - El marcador se coloca en el punto seleccionado.
   - Los campos de latitud y longitud se auto-rellenan.
   - El marcador es arrastrable para ajustar la posición.

**Resultado esperado:** El dueño marca la ubicación visualmente sin escribir
coordenadas.

### P02.2 · Mapa en vista pública del restaurante

1. Ir a `/restaurants/<slug>` (detalle de un restaurante).
2. **Verificar:**
   - Se muestra un mapa con el pin del restaurante.
   - El mapa es interactivo (zoom, arrastrar).

**Resultado esperado:** El cliente ve dónde queda el restaurante.

### P02.3 · Filtro por distancia

1. Ir a `/restaurants`.
2. Permitir acceso a la ubicación del navegador (o simularla).
3. Usar los filtros de distancia: 5 km, 10 km.
4. **Verificar:**
   - Solo aparecen restaurantes dentro del radio seleccionado.
   - La opción "Más cercano" ordena por distancia ascendente.

**Resultado esperado:** El filtro de distancia funciona con PostGIS.

### P02.4 · Filtro "abierto ahora"

1. En `/restaurants`, activar el filtro **"Abierto ahora"**.
2. **Verificar:**
   - Solo aparecen restaurantes cuyo horario incluye la hora actual.
   - Al desactivar el filtro, vuelven todos los restaurantes.

**Resultado esperado:** Filtro por horario funcional.

### P02.5 · Filtro por disponibilidad de mesas

1. En `/restaurants`, activar **"Con mesas disponibles"**.
2. **Verificar:**
   - Solo aparecen restaurantes con mesas libres en el momento actual.

**Resultado esperado:** Filtro de disponibilidad real funciona.

### P02.6 · Toggle vista lista / mapa

1. En `/restaurants`, hacer clic en el botón de cambiar vista (lista/mapa).
2. **Verificar:**
   - En vista **mapa**: se muestran pines por restaurante.
   - Al hacer clic en un pin: aparece mini tarjeta con nombre, rating y
     botón reservar.
   - Los **filtros** aplicados se mantienen al cambiar de vista.
   - En vista **lista**: vuelve al listado de tarjetas.

**Resultado esperado:** Ambas vistas funcionan con los mismos filtros.

---

## P03 · Dashboard del dueño completo (Sprint 7)

### P03.1 · Gestión de mesas y secciones

1. Como **dueño**, ir a **Dashboard** → sección de mesas/secciones.
2. Crear una **sección** (ej: "Terraza", tipo: exterior, capacidad: 20).
3. Dentro de la sección, crear una **mesa** (ej: mesa 1, capacidad 4).
4. **Verificar:**
   - La sección aparece en la lista con su tipo y capacidad.
   - La mesa aparece dentro de la sección.
   - Se puede editar nombre, capacidad y tipo de la sección.
   - Se puede activar/desactivar una mesa.
   - Se puede eliminar mesa y sección.

**Resultado esperado:** CRUD completo de secciones y mesas.

### P03.2 · Categorías de comida

1. Como **admin**, verificar que existen categorías predefinidas (peruano,
   italiano, fast food, etc.).
2. Como **dueño**, editar un restaurante y asignarle categorías.
3. **Verificar:**
   - Las categorías se guardan y se muestran en la vista pública.

**Resultado esperado:** Restaurantes con categorías de comida.

### P03.3 · Filtro por tipo de comida

1. Ir a `/restaurants`.
2. Abrir el filtro de categorías.
3. Seleccionar una categoría (ej: "Peruano").
4. **Verificar:**
   - Solo aparecen restaurantes de esa categoría.
   - Se pueden seleccionar múltiples categorías.

**Resultado esperado:** Filtro funcional por tipo de comida.

### P03.4 · Feriados

1. Como **dueño**, ir a **Dashboard** → editar restaurante → **Horarios**.
2. Agregar un feriado (ej: "Navidad", 25/12, cerrado).
3. **Verificar:**
   - El feriado aparece en la lista de feriados.
   - Se puede editar y eliminar.
   - En la vista pública, el horario refleja el feriado.

**Resultado esperado:** Soporte de feriados en horarios.

### P03.5 · Mejoras en promociones

1. Como **dueño**, ir a **Dashboard** → **Promociones**.
2. **Verificar:**
   - Se puede **activar/desactivar** una promoción con toggle.
   - Se puede **duplicar** una promoción existente.
   - Las **fechas** se validan (fecha fin >= fecha inicio).

**Resultado esperado:** Gestión mejorada de promociones.

### P03.6 · Respuestas del dueño a reseñas

1. Como **cliente**, dejar una reseña en un restaurante (requiere reserva
   completada).
2. Como **dueño**, ir a la vista del restaurante → sección de reseñas.
3. Hacer clic en **"Responder"** en una reseña.
4. Escribir una respuesta y guardar.
5. **Verificar:**
   - La respuesta aparece debajo de la reseña.
   - En la vista pública se ve la respuesta del dueño.

**Resultado esperado:** Los dueños pueden responder reseñas públicamente.

---

## P04 · UX, Filtros Avanzados y Responsive (Sprint 8)

### P04.1 · Responsive design

1. Abrir la app en un navegador de escritorio.
2. Reducir el ancho de la ventana a **móvil** (~375px).
3. Navegar por:
   - `/restaurants` (listado)
   - `/restaurants/<slug>` (detalle)
   - `/dashboard` (panel del dueño)
   - `/login` y `/register`
4. **Verificar:**
   - El sidebar del dashboard se **colapsa** en móvil.
   - Las tarjetas de restaurante se apilan verticalmente.
   - Los filtros se adaptan al ancho de pantalla.
   - Todos los formularios son usables en móvil.
   - No hay contenido desbordado ni scrolls horizontales.

**Resultado esperado:** Toda la app es mobile-first y funcional.

### P04.2 · Filtro por rango de precio

1. Ir a `/restaurants`.
2. Usar los filtros de precio: **Económico** (LOW), **Moderado** (MEDIUM),
   **Premium** (HIGH).
3. **Verificar:**
   - Los restaurantes se filtran según el promedio de precios de sus platos.
   - Umbrales: LOW < S/. 15, MEDIUM S/. 15-35, HIGH > S/. 35.

**Resultado esperado:** Filtro por precio calculado desde el menú real.

### P04.3 · Onboarding del cliente

1. Como **cliente nuevo** (sin historial), ir a `/restaurants`.
2. **Verificar:**
   - Aparece el **tour de bienvenida** automáticamente.
   - El tour recorre: bienvenida → filtros → listado → asistente.
   - Los botones **Siguiente**, **Anterior** y **Saltar** funcionan.
   - Al completar o saltar, el tour no vuelve a aparecer.
3. Para repetir: `localStorage.removeItem('onboarding_seen_<userId>')`.

**Resultado esperado:** Tour interactivo funcional para nuevos usuarios.

### P04.4 · Favoritos del cliente

1. Como **cliente** autenticado, ir a `/restaurants`.
2. Hacer clic en el **corazón** de un restaurante.
3. **Verificar:**
   - El corazón cambia a relleno/activo.
   - Al recargar la página, el favorito persiste.
   - Se puede quitar el favorito haciendo clic de nuevo.

**Resultado esperado:** Favoritos con persistencia en base de datos.

### P04.5 · Horarios mejorados en vista de detalle

1. Ir a `/restaurants/<slug>` (detalle de un restaurante).
2. **Verificar:**
   - Se muestra el horario **por día** de la semana.
   - Hay un indicador **"Abierto ahora"** (punto verde) o **"Cerrado"** (punto
     rojo) según la hora actual.
   - Si se intenta reservar fuera de horario, el formulario lo valida.

**Resultado esperado:** Horarios claros con indicador de estado.

---

# ETAPA 3 — Core de Reservas

---

## P05 · Login con Google OAuth (Sprint 9)

### P05.1 · Login como cliente con Google

1. Ir a `/login` o `/register`.
2. Hacer clic en **"Iniciar sesión con Google"**.
3. Seleccionar una cuenta de Google.
4. **Verificar:**
   - El sistema crea el usuario con rol **CLIENTE** (o lo actualiza si ya
     existía).
   - Se redirige al listado de restaurantes.
   - En el perfil, se muestra el nombre y avatar de Google.
   - El JWT se almacena correctamente.

**Resultado esperado:** Login fluido con Google OAuth.

> **Requisito:** Configurar en Google Cloud Console el origen
> `http://localhost:3000` y tener `GOOGLE_CLIENT_ID` en `.env`.

### P05.2 · Formulario de reserva simplificado

1. Como cliente autenticado con Google, ir a un restaurante y hacer clic en
   **"Reservar"**.
2. **Verificar:**
   - Se abre un **modal** de reserva moderno.
   - Los campos del perfil (nombre, email) ya están pre-rellenados.
   - Solo se piden: **celular** (se guarda la primera vez y se pre-rellena en
     las siguientes), **fecha**, **hora**, **número de personas**.
   - Si el restaurante tiene secciones (terraza, interior, etc.), aparece un
     selector de **sección** (opcional).

**Resultado esperado:** Formulario mínimo con datos pre-rellenados.

### P05.3 · Resumen antes de confirmar

1. Completar el formulario de reserva hasta el paso final.
2. **Verificar:**
   - Se muestra un resumen con: fecha, hora, personas, mesas asignadas,
     sección (si aplica) y adelanto estimado (si el restaurante lo exige).
   - Hay botón "Confirmar reserva" y "Volver".

**Resultado esperado:** El cliente ve todos los detalles antes de confirmar.

---

## P06 · Parametrización de reservas (Sprint 10)

### P06.1 · Panel de reglas de reserva

1. Como **dueño**, ir a **Dashboard** → **Reglas de reserva**
   (`/dashboard/reservas-config`).
2. **Verificar:**
   - El selector de restaurante usa tarjetas (`RestaurantPicker`), igual que
     en Menús y Promociones.
   - Se pueden configurar:
     - Horas mínimas de anticipación.
     - Horas límite para cancelación.
     - Personas por mesa (default 2).
     - Exigir adelanto (sí/no).
     - Umbral de grupo pequeño/grande.
     - Tipo de adelanto para grupo pequeño (plato más económico / monto fijo).
     - Porcentaje de adelanto para grupo grande.
     - Términos y condiciones (texto libre).
     - Permitir selección de sección (sí/no).
     - Información de pago (formas de pago, cuentas, etc.).
   - Sin tocar nada, el botón **Guardar** está **deshabilitado**.
   - Al cambiar cualquier campo → el botón se **habilita** y aparece el
     mensaje **"Tienes cambios sin guardar"**.
   - Guardar → el botón vuelve a deshabilitarse.

**Resultado esperado:** Configuración completa de reglas con estado dirty.

### P06.2 · QR de pago

1. En **Reglas de reserva**, en la sección de formas de pago.
2. Subir una imagen del **QR de Yape/Plin**.
3. **Verificar:**
   - La imagen se sube a Cloudinary (carpeta `payment-qr`).
   - Se muestra la preview del QR cargado.
   - El QR aparece en: correo de reserva, página `/reservations` y asistente.

**Resultado esperado:** QR de pago configurable y visible en todos los canales.

### P06.3 · Asignación automática de mesas

1. Como cliente, crear una reserva para **6 personas** en un restaurante con
   `personsPerTable = 2`.
2. **Verificar:**
   - En el resumen, se asignan **3 mesas** (6 ÷ 2 = 3).
   - Si `personsPerTable = 4`, se asignan **2 mesas** (6 ÷ 4 = 1.5 → 2).

**Resultado esperado:** Cálculo correcto de mesas.

### P06.4 · Cálculo de adelanto

1. Configurar un restaurante con `requiresAdvancePayment = true`,
   `smallGroupMaxPersons = 4`, `largeGroupAdvancePercent = 50`.
2. Reservar con **3 personas** (grupo pequeño):
   - **Verificar:** adelanto = precio del plato más económico del menú.
3. Reservar con **8 personas** (grupo grande) incluyendo pre-pedido:
   - **Verificar:** adelanto = 50% del total del pre-pedido.

**Resultado esperado:** Adelanto calculado según las reglas del restaurante.

### P06.5 · Términos y condiciones

1. Como dueño, escribir términos y condiciones en la configuración.
2. Como cliente, reservar en ese restaurante.
3. **Verificar:**
   - Se muestran los términos en el formulario de reserva.
   - Hay un **checkbox** de aceptación obligatorio.
   - No se puede confirmar sin aceptar los términos.

**Resultado esperado:** Términos obligatorios si están configurados.

### P06.6 · Límite de cancelación

1. Configurar `cancellationDeadlineHours = 2` en un restaurante.
2. Crear una reserva para **dentro de 1 hora**.
3. Intentar cancelar la reserva.
4. **Verificar:**
   - Se **rechaza** la cancelación con un mensaje indicando que ya pasó el
     plazo de cancelación.
5. Crear una reserva para **mañana**. Cancelar inmediatamente.
6. **Verificar:**
   - Se cancela exitosamente.

**Resultado esperado:** Cancelación bloqueada dentro del plazo configurado.

### P06.7 · Pre-pedido del menú

1. Como cliente, reservar en un restaurante y llegar al paso de **pre-pedido**.
2. Seleccionar platos con cantidades.
3. **Verificar:**
   - Se muestra el selector de platos (`SelectMenu`).
   - Se calcula el subtotal en tiempo real.
   - En el resumen, los platos seleccionados aparecen con sus precios.
   - La reserva queda con **prioridad alta** automáticamente.
   - El adelanto se calcula como 50% del total del pedido.
4. Como dueño, ver la reserva en el dashboard.
5. **Verificar:**
   - Se ven los platos pre-pedidos con cantidades y precios.

**Resultado esperado:** Pre-pedido funcional con impacto en adelanto y
prioridad.

---

## P07 · Notificaciones inteligentes (Sprint 11)

### P07.1 · Recordatorios automáticos

> Requiere configuración de email (SMTP) en `.env`.

1. Crear una reserva para un día/hora futura que esté dentro del rango de
   recordatorio (ej: mañana).
2. Esperar a que el **scheduler** ejecute (revisa cada hora).
3. **Verificar:**
   - Se recibe un email de recordatorio **días antes** (si aplica).
   - Se recibe un email de recordatorio **horas antes** (si aplica).
   - Los tiempos de recordatorio respetan la configuración del restaurante.

**Resultado esperado:** Recordatorios automáticos enviados por el scheduler.

### P07.2 · QR code en email de confirmación

1. Crear una reserva en un restaurante con adelanto verificado (o sin adelanto).
2. Revisar el email de **confirmación**.
3. **Verificar:**
   - El email incluye un **código QR** con el código de la reserva.
   - El QR es escaneable y contiene el código (ej: `RES-XXXXXXXX`).

**Resultado esperado:** QR legible en el email de confirmación.

### P07.3 · Lista de espera

1. Llenar todas las mesas de un restaurante con reservas.
2. Como otro cliente, intentar reservar → debe indicar que **no hay mesas**.
3. Hacer clic en **"Anotarme en lista de espera"**.
4. **Verificar:**
   - Se crea una entrada en la waitlist.
   - Como dueño, se puede ver la waitlist del restaurante.
   - Si se cancela una reserva, el sistema notifica (o permite reservar).
5. El cliente puede eliminar su entrada de la waitlist.

**Resultado esperado:** Lista de espera funcional.

---

## P08 · Sistema de pago del adelanto (Sprint 12)

### P08.1 · Flujo completo de pago

**Precondición:** Un restaurante con "Exigir adelanto" activado,
`paymentInfo` configurado y QR cargado en Reglas de reserva.

1. Como **cliente**, crear una reserva que requiera adelanto.
2. **Verificar el correo "reserva recibida":**
   - Incluye el **monto** del adelanto.
   - Incluye el **concepto** (código de reserva).
   - Incluye las **formas de pago** (`paymentInfo`).
   - Incluye la **imagen del QR** del restaurante (si fue cargado).
3. Ir a `/reservations` → buscar por código de reserva.
4. **Verificar la página de la reserva:**
   - El bloque **"Adelanto"** muestra `paymentInfo` + imagen del QR (no
     "revisa tu correo").
   - Hay un botón/zona para **subir comprobante**.
5. Subir una imagen de comprobante de pago.
6. **Verificar:** el estado cambia a `PAYMENT_UPLOADED`.

**Resultado esperado:** Información de pago completa en todos los canales.

### P08.2 · Verificación de pago por el dueño

1. Como **dueño**, ir a **Dashboard** → **Pagos** (`/dashboard/pagos`).
2. **Verificar:**
   - En **"Por verificar"** aparece el comprobante subido (con contador).
   - Se puede ver la imagen del comprobante.
3. Hacer clic en **"Verificar"**.
4. **Verificar:**
   - El pago pasa al historial como **"Verificado"**.
   - La reserva cambia a estado confirmado.
5. Con otro pago, hacer clic en **"Rechazar"**.
6. **Verificar:**
   - El pago aparece como **"Rechazado"** en el historial.
   - La reserva vuelve a **"Pendiente de pago"** para que el cliente pueda
     reintentar.

**Resultado esperado:** Verificación y rechazo de pagos funcionales.

### P08.3 · Modo claro/oscuro en Pagos

1. En `/dashboard/pagos`, alternar entre **tema claro** y **tema oscuro**.
2. **Verificar:**
   - Los colores se adaptan correctamente.
   - El contraste es adecuado en ambos modos.

**Resultado esperado:** Dark mode correcto en Pagos.

---

## P09 · Asistente con IA (Sprint 12)

### P09.1 · Flujo básico del asistente

**Precondición:** `GEMINI_API_KEY` configurada. Si no, se valida el modo por
reglas.

1. Ir a la página pública (no al dashboard).
2. Hacer clic en el botón flotante **"Asistente"** (abajo a la derecha).
3. **Verificar:**
   - El botón es visible y tiene diseño rediseñado.
   - Se abre el widget del asistente.
4. Escribir el **código** de una reserva (ej: `RES-XXXXXXXX`).
5. **Verificar:** el asistente carga los datos de la reserva.

**Resultado esperado:** Widget del asistente funcional.

### P09.2 · Preguntas en lenguaje natural

1. Con una reserva cargada, preguntar: **"¿A qué hora es mi reserva?"**
2. **Verificar:**
   - La IA responde con datos reales (hora en formato 12h, personas, etc.).
   - No se repite el menú largo del restaurante.
3. Preguntar: **"¿Cuántas personas?"**
4. **Verificar:** respuesta con el número de personas.

**Resultado esperado:** Respuestas con datos reales de la reserva.

### P09.3 · Información de pago desde el asistente

1. Preguntar: **"¿Cómo pago?"** o **"¿Dónde pago?"**
2. **Verificar:**
   - Se muestra el monto del adelanto.
   - Se muestran las **formas de pago** del restaurante.
   - Se muestra el **QR real** del restaurante (si está cargado).

**Resultado esperado:** Información de pago completa desde el asistente.

### P09.4 · Acciones rápidas

1. **Verificar** que la barra fija de acciones rápidas está siempre visible
   en la parte inferior del asistente:
   - **Estado** — muestra el estado actual de la reserva.
   - **Pago** — muestra cómo y dónde pagar.
   - **Comprobante** — permite subir comprobante (requiere sesión Google).
   - **Alergias** — consulta sobre alergias/restricciones.
   - **Otra reserva** — permite cargar otra reserva.
2. Hacer clic en cada acción y verificar que funciona.

**Resultado esperado:** Todas las acciones rápidas responden correctamente.

### P09.5 · Modo por reglas (sin API key)

1. Quitar `GEMINI_API_KEY` del `.env` (o dejarla vacía).
2. Reconstruir el backend: `docker compose up --build backend -d`.
3. Abrir el asistente.
4. **Verificar:**
   - El endpoint devuelve `{"configured": false}`.
   - El asistente funciona con **respuestas predeterminadas** (modo reglas).

**Resultado esperado:** Fallback funcional sin IA.

---

## P10 · Registro de cuenta de restaurante con aprobación

### P10.1 · Formulario de registro de dueño

1. Ir a `/register`.
2. **Verificar** que el formulario es de **2 pasos**:
   - **Paso 1 "Tu cuenta":** nombre, correo, teléfono (opcional), contraseña
     + confirmación. La contraseña exige mayúscula, minúscula, número y
     símbolo.
   - **Paso 2 "Tu restaurante":** nombre, descripción, dirección, distrito,
     ciudad, región, teléfono/RUC (opcionales), capacidad, nivel de precio.
3. Completar ambos pasos y enviar.
4. **Verificar:**
   - Aparece la pantalla **"¡Solicitud recibida!"**.
   - **NO** se inicia sesión automáticamente.
   - **NO** se redirige al dashboard.
5. (Si hay correo configurado) revisar que llega el correo **"Recibimos tu
   solicitud"**.

**Resultado esperado:** Registro en 2 pasos con pantalla de confirmación.

### P10.2 · Login bloqueado para cuenta pendiente

1. Intentar iniciar sesión con la cuenta recién registrada en `/login`.
2. **Verificar:**
   - El login es **bloqueado** con HTTP 403.
   - Se muestra el mensaje: **"Tu solicitud de cuenta está en revisión…"**

**Resultado esperado:** Acceso bloqueado mientras la cuenta está en revisión.

### P10.3 · Aprobación por admin

1. Iniciar sesión como **admin** (`admin@tingo-restaurants.com`).
2. Ir a **Dashboard** → **Solicitudes** (`/dashboard/solicitudes`).
3. **Verificar:**
   - Se ve la solicitud con datos del dueño y del restaurante.
4. Hacer clic en **"Aprobar y publicar"**.
5. **Verificar:**
   - Toast de éxito.
   - La solicitud desaparece de la lista.
   - (Si hay correo) llega correo de **aprobación** al dueño.
6. Iniciar sesión con la cuenta del dueño.
7. **Verificar:**
   - Ahora **sí entra** al panel del dueño.
   - El restaurante aparece **público** en `/restaurants`.

**Resultado esperado:** Flujo de aprobación completo.

### P10.4 · Rechazo por admin

1. Crear otra solicitud (repetir P10.1 con datos nuevos).
2. Como admin, ir a **Solicitudes** y hacer clic en **"Rechazar"** (ingresar
   un motivo).
3. **Verificar:**
   - La solicitud desaparece de la lista.
   - (Si hay correo) llega correo de **rechazo** con el motivo.
4. Intentar iniciar sesión con la cuenta rechazada.
5. **Verificar:**
   - Se muestra: **"Tu solicitud de cuenta fue rechazada: <motivo>"**.

**Resultado esperado:** Rechazo con motivo y notificación.

### P10.5 · UI de login actualizada

1. Ir a `/login`.
2. **Verificar:**
   - El enlace inferior aclara que el **registro es para restaurantes**.
   - Se indica que los **clientes usan Google**.

**Resultado esperado:** Mensajes claros sobre los tipos de registro.

---

## P11 · Onboarding mejorado

### P11.1 · Tour del cliente (SpotlightTour)

1. Como cliente (usar Google), ir a `/restaurants`.
2. Si es la primera vez (o borrar flag), debe aparecer el **tour**.
3. **Verificar:**
   - La tarjeta se ubica **al lado** del elemento resaltado (no lo tapa).
   - Los botones Saltar / Siguiente / Anterior funcionan.
   - En **móvil** (sidebar oculto): la tarjeta se muestra **centrada y
     legible**.

**Resultado esperado:** Tour no invasivo y responsive.

### P11.2 · Tour del dueño

1. Con un dueño **recién aprobado**, entrar a `/dashboard`.
2. Debe aparecer el **tour del dueño**.
3. **Verificar:**
   - Recorre el sidebar: restaurante → menús → promociones → **reglas de
     reserva y pagos** → reservas → reportes.
   - La tarjeta se ubica **al lado** de cada ítem del sidebar.
   - Los ítems del sidebar tienen atributos `data-tour="nav-<clave>"`.

**Resultado esperado:** Tour del dueño completo y no invasivo.

---

## P12 · Ofertas con flyer (IA)

### P12.1 · Generar flyer con IA

1. Como **dueño**, ir a **Dashboard** → **Promociones**.
2. En una promoción existente, hacer clic en **"Generar flyer"**.
3. **Verificar:**
   - Se muestra una **vista previa** del flyer con titular y subtítulo
     generados por IA (Gemini texto).
   - El diseño del flyer usa `PromoFlyer.tsx`.
   - Los datos se guardan en `flyer_headline` y `flyer_tagline`.
4. Si la IA no está disponible:
   - **Verificar:** usa el título/descripción de la promoción como fallback.

**Resultado esperado:** Flyer generado con copy de IA o fallback.

### P12.2 · Carrusel de ofertas en página principal

1. Ir a `/restaurants`.
2. **Verificar:**
   - Se muestra un **carrusel de ofertas** con las promociones activas de
     todos los restaurantes.
   - Las ofertas se muestran como **flyers**.
   - Se puede navegar con las flechas ◀ ▶ (sin barra de scroll visible).
   - El carrusel es **responsive** y funciona en **dark mode**.

**Resultado esperado:** Carrusel funcional y visualmente atractivo.

---

## P13 · Responsive y modo claro/oscuro (transversal)

### P13.1 · Verificación de dark mode

Alternar entre tema **claro** y **oscuro** y revisar las siguientes vistas:

| Vista | Ruta | Verificar |
|-------|------|-----------|
| Registro | `/register` | Formulario legible, contrastes correctos |
| Login | `/login` | Botón Google visible, contrastes correctos |
| Restaurantes | `/restaurants` | Tarjetas, filtros, carrusel |
| Detalle | `/restaurants/<slug>` | Menú, galería, reseñas, mapa |
| Reservas | `/reservations` | Búsqueda, bloque de adelanto |
| Dashboard | `/dashboard` | Sidebar, estadísticas |
| Pagos | `/dashboard/pagos` | Listado, verificación |
| Solicitudes | `/dashboard/solicitudes` | Tarjetas de solicitud |
| Reglas | `/dashboard/reservas-config` | Formulario, QR |
| Asistente | Botón flotante | Chat, acciones rápidas |

**Resultado esperado:** Todas las vistas se ven correctamente en ambos temas.

### P13.2 · Responsive en móvil

1. Reducir la ventana a **375px** de ancho.
2. Navegar por todas las vistas listadas arriba.
3. **Verificar:**
   - No hay contenido desbordado.
   - No hay scrolls horizontales innecesarios.
   - Los formularios son usables.
   - El sidebar se colapsa.
   - El onboarding muestra tarjetas centradas si el sidebar está oculto.

**Resultado esperado:** UX completa en dispositivos móviles.

---

## Pruebas rápidas por API (curl)

### Etapa 2

```bash
# Firma de subida a Cloudinary
curl -s -X POST http://localhost:8080/api/v1/images/sign \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"folder":"restaurants"}'

# Búsqueda por distancia (5 km)
curl -s "http://localhost:8080/api/v1/geo/nearby?lat=-9.2951&lng=-76.0131&radiusKm=5"

# Categorías
curl -s http://localhost:8080/api/v1/categories

# Favoritos (requiere token de cliente)
curl -s http://localhost:8080/api/v1/favorites \
  -H "Authorization: Bearer <TOKEN>"
```

### Etapa 3

```bash
# Login con Google (enviar token de Google)
curl -s -X POST http://localhost:8080/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"<GOOGLE_ID_TOKEN>"}'

# Registro de dueño (queda pendiente de aprobación)
curl -s -X POST http://localhost:8080/api/v1/auth/register-owner \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Prueba","email":"p@x.com","password":"Admin@1234!","restaurant":{"name":"R","address":"Av 1","city":"Tingo Maria","region":"Huanuco","totalCapacity":40}}'

# Login pendiente -> 403 ACCOUNT_PENDING
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"p@x.com","password":"Admin@1234!"}'

# Config de reserva
curl -s http://localhost:8080/api/v1/reservation-config/restaurant/<RESTAURANT_ID> \
  -H "Authorization: Bearer <TOKEN>"

# Asistente (sin key -> {"configured":false})
curl -s -X POST http://localhost:8080/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hola"}]}'

# Waitlist
curl -s -X POST http://localhost:8080/api/v1/waitlist \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"restaurantId":"<ID>","date":"2026-06-25","personsCount":4}'

# Pagos de un restaurante
curl -s http://localhost:8080/api/v1/payments/restaurant/<RESTAURANT_ID> \
  -H "Authorization: Bearer <TOKEN>"

# Promociones showcase (público)
curl -s http://localhost:8080/api/v1/promotions/showcase
```

---

## Resumen de pruebas

| # | Prueba | Etapa | Sprint | Prioridad |
|---|--------|-------|--------|-----------|
| P01 | Subida de imágenes a Cloudinary | E2 | S5 | Alta |
| P02 | Mapas y geolocalización | E2 | S6 | Alta |
| P03 | Dashboard del dueño completo | E2 | S7 | Alta |
| P04 | UX, Filtros y Responsive | E2 | S8 | Alta |
| P05 | Login con Google OAuth | E3 | S9 | Alta |
| P06 | Parametrización de reservas | E3 | S10 | Alta |
| P07 | Notificaciones inteligentes | E3 | S11 | Media |
| P08 | Sistema de pago del adelanto | E3 | S12 | Alta |
| P09 | Asistente con IA | E3 | S12 | Media |
| P10 | Registro con aprobación | E3 | Extra | Alta |
| P11 | Onboarding mejorado | E3 | Extra | Media |
| P12 | Ofertas con flyer (IA) | E3 | Extra | Baja |
| P13 | Responsive y dark mode | Ambas | Transversal | Alta |
