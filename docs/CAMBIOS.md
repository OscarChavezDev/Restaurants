# Documento de Cambios — Etapas 2 y 3

Registro completo de las funcionalidades implementadas en el Sistema de
Restaurantes (Tingo María) durante las Etapas 2 y 3. Código, UI y correos en
español; build con Docker; esquema administrado por Flyway.

---

# ETAPA 2 — Calidad Visual y Experiencia Base

> **Objetivo:** Elevar la calidad percibida del sistema con imágenes reales,
> mapas interactivos, dashboard del dueño completo, filtros útiles y diseño
> responsive. El cliente y el dueño tienen una experiencia fluida antes de
> abordar el core de reservas en la Etapa 3.

---

## Sprint 5 — Multimedia Real

**Objetivo:** Reemplazar el sistema de URLs por subida real de imágenes a
Cloudinary. El dueño sube fotos desde su PC o celular. Los platos también
tienen imagen.

### S5-01 · Integración con Cloudinary

El backend genera una firma (signed upload URL) para que el frontend suba las
imágenes directamente a Cloudinary sin pasar por el servidor.

- **Backend:**
  - `application/service/CloudinarySignatureService.java` — genera la firma con
    el SDK de Cloudinary.
  - `infrastructure/web/controller/ImageUploadController.java` →
    `POST /v1/images/sign` — endpoint para obtener firma de subida.
  - Variables de entorno: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
    `CLOUDINARY_API_SECRET`.
- **Frontend:**
  - `services/uploadToCloudinary.ts` — función utilitaria que sube a
    Cloudinary con la firma obtenida del backend.

### S5-02 · Widget de subida real de imágenes

Reemplazó el antiguo `PhotoManager.tsx` (que aceptaba URLs) por un widget de
subida de archivos.

- **Frontend:**
  - `components/ui/ImageUploader.tsx` — widget de subida con preview,
    drag-and-drop y progreso.
  - `components/ui/PhotoManager.tsx` — refactorizado para usar `ImageUploader`
    en vez del input de URL.

### S5-03 · Imagen por plato del menú

Cada plato puede tener su propia imagen, subida a Cloudinary.

- **Backend:**
  - Campo `imageUrl` en `DishEntity` y en los DTOs de respuesta/request.
  - `cloudinary_public_id` en `dishes` para poder eliminar del CDN.
- **Frontend:**
  - Componente de edición de plato muestra `ImageUploader` para la foto.

### S5-04 · Galería pública mejorada

Galería con lightbox, reordenamiento y eliminación desde el dashboard.

- **Backend:**
  - Campo `cloudinary_public_id` en `restaurant_images` para eliminación
    desde el CDN.
- **Frontend:**
  - `components/ui/PhotoManager.tsx` — lightbox al hacer clic en imagen,
    orden drag-and-drop, botón eliminar.

---

## Sprint 6 — Mapas y Geolocalización

**Objetivo:** El dueño marca la ubicación en un mapa (no más lat/lng manual).
El cliente ve dónde queda el restaurante y puede filtrar por distancia.

### S6-01 · Google Maps en dashboard del dueño

Clic en el mapa auto-rellena latitud/longitud.

- **Frontend:**
  - `components/ui/LocationPicker.tsx` — componente con mapa interactivo,
    marcador arrastrable, auto-rellena campos lat/lng.

### S6-02 · Mapa embebido en vista pública del restaurante

El cliente ve la ubicación del restaurante en un mapa estático o interactivo.

- **Frontend:**
  - `components/ui/LocationMap.tsx` — mapa embebido con pin del restaurante.

### S6-03 · Filtro por distancia

Búsqueda geoespacial por radio: 5 km / 10 km / ordenar por más cercano.

- **Backend:**
  - `infrastructure/web/controller/GeoController.java` — endpoint de búsqueda
    por coordenadas y radio.
  - Parámetros nuevos en `SearchRestaurantRequest`: `lat`, `lng`, `radiusKm`.
  - Usa `ST_DWithin` de PostGIS para filtro por radio.
- **Frontend:**
  - Filtros de distancia en `restaurants/page.tsx` — botones 5 km / 10 km y
    opción de ordenar por cercanía.

### S6-04 · Filtrado por "abierto ahora"

Filtra restaurantes que están abiertos en el momento de la consulta.

- **Frontend:**
  - Lógica client-side en `restaurants/page.tsx` que compara el horario del
    restaurante con la hora actual del navegador.

### S6-05 · Filtro por disponibilidad real de mesas

Solo muestra restaurantes con mesas libres en el momento actual.

- **Backend:**
  - Endpoint `available-now` + filtro `availableNowFilter` que consulta
    reservas activas vs capacidad.
- **Frontend:**
  - Toggle "Con mesas disponibles" en `restaurants/page.tsx`.

### S6-06 · Toggle vista lista / mapa

Ambas vistas disponibles; los filtros aplican en las dos.

- **Frontend:**
  - Estado local `viewMode: 'list' | 'map'` en `restaurants/page.tsx`.
  - `components/ui/RestaurantsMap.tsx` — vista de mapa con pines por
    restaurante; al hacer clic aparece mini tarjeta con nombre, rating y
    botón reservar.

---

## Sprint 7 — Dashboard del Dueño Completo

**Objetivo:** Control total del restaurante desde el dashboard: mesas,
secciones, horarios mejorados, promociones mejoradas y tipo de comida.

### S7-01 · Gestión de mesas y secciones del local

- **Backend:**
  - Migración `V10__sections_and_tables.sql` — tablas `restaurant_sections`
    y `restaurant_tables`.
  - `RestaurantSectionEntity` — nombre, capacidad, tipo
    (interior / exterior / terraza / bar).
  - `RestaurantTableEntity` — número, capacidad, sección, estado
    (activa / inactiva).
  - `infrastructure/web/controller/LayoutController.java` — CRUD de secciones
    y mesas.
- **Frontend:**
  - `components/ui/TablesManager.tsx` — interfaz visual de secciones y mesas
    con drag-and-drop.

### S7-02 · Categorías / tipo de comida por restaurante

- **Backend:**
  - `FoodCategoryEntity` — entidad de categorías (peruano, italiano, fast food,
    etc.).
  - `infrastructure/web/controller/CategoryController.java` — CRUD de
    categorías.
- **Frontend:**
  - `components/ui/CategoryModal.tsx` — modal para seleccionar categorías.
  - `components/ui/CategoryPicker.tsx` — picker compacto de categorías.

### S7-03 · Filtro por tipo de comida en búsqueda pública

- **Frontend:**
  - `selectedCategories` + `CategoryModal` en `restaurants/page.tsx` — el
    cliente filtra por tipo de comida.

### S7-04 · Editor de horarios mejorado — soporte de feriados

- **Backend:**
  - Migración `V9__restaurant_holidays.sql` — tabla `restaurant_holidays`.
  - `RestaurantHolidayEntity` — fecha, nombre del feriado, flag de cerrado.
  - `infrastructure/web/controller/HolidayController.java` — CRUD de feriados.
- **Frontend:**
  - `components/ui/ScheduleEditor.tsx` — editor mejorado con soporte de
    feriados.

### S7-05 · Mejoras en promociones

Toggle activo/inactivo, duplicar, validación de fechas.

- **Backend:**
  - Migración `V8__fix_promotion_types.sql` — ajuste de tipos de promoción.
  - `PromotionService` — lógica de toggle, duplicar, validación de fechas.
- **Frontend:**
  - Dashboard de promociones con toggle, botón duplicar y validación.

### S7-06 · Respuestas del dueño a reseñas

- **Backend:**
  - Migración `V12__rating_owner_reply.sql` — campo `owner_reply` en
    `ratings`.
  - `RatingService` — método para agregar respuesta del dueño.
  - `RatingController` — endpoint para responder reseñas.
- **Frontend:**
  - `features/restaurants/RatingsSection.tsx` — con `canReply` para mostrar
    formulario de respuesta.

---

## Sprint 8 — UX, Filtros Avanzados y Responsive

**Objetivo:** La app funciona bien en celular. El cliente tiene filtros útiles
y guías de uso.

### S8-01 · Responsive design completo

Mobile-first en todas las vistas.

- **Frontend:**
  - Clases CSS responsive en todos los componentes y páginas.
  - Sidebar colapsable en móvil.

### S8-02 · Filtro por rango de precio

Al crear/editar/eliminar un plato se recalcula el promedio del menú. Ese
promedio define LOW / MEDIUM / HIGH.

- **Backend:**
  - Migración `V13__avg_dish_price.sql` — campo `avg_dish_price` en
    `restaurants`.
  - `DishService` — recálculo de `avgDishPrice` en cada operación CRUD de
    plato (`SELECT AVG(price) FROM dishes WHERE ...`).
  - Filtro `priceRange=LOW|MEDIUM|HIGH` en endpoint de búsqueda.
  - Umbrales: LOW < 15, MEDIUM 15-35, HIGH > 35 (en soles).
- **Frontend:**
  - Filtros LOW/MEDIUM/HIGH en `restaurants/page.tsx`.

### S8-03 · Onboarding para nuevos usuarios

Tour interactivo al entrar por primera vez.

- **Frontend:**
  - `components/ui/OnboardingTour.tsx` — tour del cliente al visitar
    `/restaurants` por primera vez.
  - Flag `onboarding_completed` en `localStorage`.

### S8-04 · Favoritos del cliente

Guardar restaurantes favoritos con persistencia en base de datos.

- **Backend:**
  - Migración `V14__customer_favorites.sql` — tabla `customer_favorites`.
  - `FavoriteEntity` — relación cliente-restaurante.
  - `infrastructure/web/controller/FavoriteController.java` — CRUD de
    favoritos.
- **Frontend:**
  - `components/ui/FavoriteButton.tsx` — botón corazón en tarjeta de
    restaurante.
  - `hooks/useFavorites.ts` — hook de TanStack Query para favoritos.

### S8-05 · Experiencia de horarios en vista de detalle

Horario por día, indicador "abierto ahora", validación en formulario de
reserva.

- **Frontend:**
  - Vista de horarios mejorada en `restaurants/[slug]/page.tsx`.
  - Indicador "Abierto ahora" con punto verde/rojo.
  - Validación del formulario de reserva contra el horario.

---

# ETAPA 3 — Core de Reservas

> **Objetivo:** Convertir las reservas en el núcleo real del negocio. Flujo
> profesional con Google OAuth, parametrización de reglas por restaurante,
> notificaciones automáticas, sistema de pagos con verificación y asistente
> con IA.

---

## Sprint 9 — Flujo de Reserva Moderno

**Objetivo:** Reemplazar el formulario de reserva por una experiencia moderna
con Google OAuth.

### S9-01 · Login con Google OAuth

- **Backend:**
  - Migración `V15__google_oauth_users.sql` — campos `google_id`,
    `avatar_url`, `auth_provider` en `users`.
  - `AuthService` — flujo de autenticación con Google (verifica token de
    Google, crea o actualiza usuario, genera JWT).
  - `AuthController` → `POST /v1/auth/google` — endpoint público de login
    con Google.
  - `SecurityConfig` — `permitAll` para `/v1/auth/google`.
- **Frontend:**
  - `components/ui/GoogleLoginButton.tsx` — botón de inicio de sesión con
    Google (usa la librería `@react-oauth/google`).
  - `authService.ts` — `loginWithGoogle()` envía el token al backend.

### S9-02 · Nueva UI de reserva

Ventana flotante (modal) para reservar, accesible desde la página de detalle
del restaurante.

- **Frontend:**
  - Modal de reserva en `restaurants/[slug]/page.tsx` con diseño moderno.
  - Animaciones de entrada/salida.

### S9-03 · Formulario simplificado post-login

Solo pide lo que no se obtiene del perfil de Google: celular, fecha, hora,
número de personas.

- **Frontend:**
  - Formulario reducido con datos pre-rellenados del perfil Google.
  - `celular` se guarda en `CustomerEntity` la primera vez y se pre-rellena.

### S9-04 · Selección de sección del restaurante

Si el restaurante tiene secciones definidas (Sprint 7 S7-01), el cliente
puede elegir dónde sentarse.

- **Backend:**
  - Migración `V16__reservation_section.sql` — campo `section_id` en
    `reservations`.
  - `ReservationService` — validación de sección seleccionada contra
    disponibilidad.
- **Frontend:**
  - Selector de sección en el formulario de reserva (solo si el restaurante
    tiene secciones).

### S9-05 · Resumen antes de confirmar

Pantalla de resumen con fecha, hora, mesas asignadas y adelanto estimado.

- **Frontend:**
  - Paso final del modal de reserva con resumen completo antes de confirmar.

---

## Sprint 10 — Parametrización de Reservas

**Objetivo:** Cada restaurante define sus propias reglas de reserva. El
sistema las aplica automáticamente.

### S10-01 · Panel de parametrización en dashboard del dueño

- **Backend:**
  - Migración `V17__reservation_config_and_waitlist.sql` — tabla
    `reservation_config` con campos: `min_advance_hours`,
    `cancellation_deadline_hours`, `persons_per_table`,
    `requires_advance_payment`, `small_group_max_persons`,
    `small_group_advance_type`, `large_group_advance_percent`,
    `terms_and_conditions`, `allow_section_selection`, `payment_info`.
  - `ReservationConfigService.java` — CRUD de configuración.
  - `infrastructure/web/controller/ReservationConfigController.java` →
    `GET /v1/reservation-config/restaurant/{id}` y
    `PUT /v1/reservation-config/restaurant/{id}`.
- **Frontend:**
  - `app/dashboard/reservas-config/page.tsx` — panel "Reglas de reserva".
  - `services/reservationConfigService.ts` — servicio de config.
  - Botón **Guardar** con estado *dirty* (solo se activa si hay cambios) +
    aviso "Tienes cambios sin guardar".
  - Selector de restaurante usa `RestaurantPicker`.

### S10-02 · Lógica de asignación de mesas

Cálculo automático de mesas según número de personas y capacidad por mesa.

- **Backend:**
  - `ReservationService` — lógica de asignación: `personas / personsPerTable`
    redondeado hacia arriba.

### S10-03 · Regla de adelanto

Cálculo automático del adelanto según las reglas del restaurante.

- **Backend:**
  - Lógica en `ReservationService`:
    - Si `personas <= smallGroupMaxPersons` → adelanto = precio del plato más
      económico del menú.
    - Si grupo grande → adelanto = suma de platos del pedido ×
      `largeGroupAdvancePercent / 100`.

### S10-04 · Términos y condiciones por restaurante

Texto editable por el dueño; el cliente debe aceptarlos al reservar.

- **Backend:**
  - Campo `terms_and_conditions` en `reservation_config`.
  - Campo `terms_accepted` en `ReservationEntity`.
- **Frontend:**
  - Checkbox de aceptación en el formulario de reserva.
  - Editor de términos en el panel de configuración.

### S10-05 · Límite de cancelación

El restaurante define cuántas horas antes se puede cancelar.

- **Backend:**
  - Campo `cancellation_deadline_hours` en `reservation_config`.
  - Validación en `ReservationService.cancel()` — rechaza cancelaciones
    fuera del plazo.

### S10-06 · Prioridad de reserva

Prioridad alta si ya incluye pedido del menú.

- **Backend:**
  - Campo `priority` en `ReservationEntity`.
  - Se marca `HIGH` automáticamente si el cliente incluye pre-pedido.

### S10-07 · Pre-pedido del menú al reservar

Paso opcional donde el cliente elige platos antes de llegar.

- **Backend:**
  - Migración `V18__reservation_order_items.sql` — tabla
    `reservation_order_items (reservation_id, dish_id, quantity,
    unit_price)`.
  - `ReservationService` — guarda los ítems del pre-pedido, recalcula
    adelanto al 50% del total.
- **Frontend:**
  - `components/ui/SelectMenu.tsx` — selector de platos con cantidad.
  - Paso "Pre-pedido" en el modal de reserva.

---

## Sprint 11 — Notificaciones Inteligentes

**Objetivo:** El cliente recibe recordatorios automáticos. El restaurante
reduce los no-shows.

### S11-01 y S11-02 · Emails recordatorio

Recordatorios automáticos días y horas antes de la reserva.

- **Backend:**
  - `EmailService` — templates `sendReservationReminder` (días antes) y
    `sendReservationReminderHours` (horas antes).
  - Campos configurables en `ReservationConfig`: tiempos de recordatorio.

### S11-03 · Scheduler automático de notificaciones

- **Backend:**
  - `application/service/ReservationReminderScheduler.java` — servicio con
    `@Scheduled` que revisa reservas pendientes cada hora y envía
    recordatorios según la configuración.

### S11-04 · QR code en el email de confirmación

El cliente muestra el QR al llegar al restaurante.

- **Backend:**
  - Generación de QR con el código de la reserva usando librería `zxing`.
  - QR adjunto en el email de confirmación.

### S11-05 · Lista de espera (waitlist)

Si no hay mesas, el cliente se anota y le avisan si se libera.

- **Backend:**
  - Tabla `waitlist_entries` en migración
    `V17__reservation_config_and_waitlist.sql`.
  - `application/service/WaitlistService.java` — gestión de la lista de
    espera.
  - `infrastructure/web/controller/WaitlistController.java` — endpoints
    REST para la waitlist.
- **Frontend:**
  - `services/waitlistService.ts` — servicio frontend.
  - Opción "Anotarme en lista de espera" cuando no hay mesas disponibles.

---

## Sprint 12 — Sistema de Pago del Adelanto

**Objetivo:** El adelanto se cobra y verifica. Un asistente con IA ayuda al
cliente. El restaurante sabe si el cliente ya pagó.

### S12-01 · Cálculo automático del adelanto

- **Backend:**
  - `ReservationService` lee `ReservationConfig` del restaurante y calcula
    `advanceAmount` al crear la reserva.
  - El monto se guarda en `ReservationEntity`.

### S12-02 · Instrucciones de pago en el email

El correo de "reserva recibida" incluye monto, concepto, formas de pago y QR.

- **Backend:**
  - `EmailService.sendReservationCreated` — ahora usa `paymentBlock(r)` que
    incluye toda la información de pago.
  - Se muestra `paymentInfo` del restaurante + imagen del QR (si fue cargado).

### S12-03 · Panel de verificación de pagos

Apartado propio "Pagos" en el dashboard del dueño.

- **Backend:**
  - Migración `V19__payments.sql` — tabla `payments` con campos
    `reservation_id`, `amount`, `method`, `status`, `proof_image_url`,
    `verified_at`, `verified_by`.
  - `application/service/PaymentService.java` — lógica de verificar y
    rechazar pagos.
  - `infrastructure/web/controller/PaymentController.java`:
    - `POST /v1/payments/proof` — el cliente sube comprobante.
    - `PATCH /v1/payments/{id}/verify` — el dueño verifica.
    - `PATCH /v1/payments/{id}/reject` — el dueño rechaza.
    - `GET /v1/payments/restaurant/{id}` — pagos por restaurante.
- **Frontend:**
  - `app/dashboard/pagos/page.tsx` — apartado "Pagos" con sección "Por
    verificar" (con contador) e historial. Responsive y modo claro/oscuro.
  - `services/paymentService.ts` — servicio de pagos.
  - Nuevo ítem `payments` en el sidebar.

### S12-04 · Asistente de reservas con IA (Gemini)

Widget flotante "Asistente" que responde preguntas en lenguaje natural usando
el contexto real de la reserva.

- **Proveedor:** Google Gemini (capa gratuita de Google AI Studio). Modelo
  `gemini-2.5-flash-lite`. Si falta la API key → modo por reglas (fallback).
- **Config:** `GEMINI_API_KEY` y `GEMINI_MODEL` en `.env`.
- **Backend:**
  - `application/dto/request/AssistantChatRequest.java`
  - `application/service/AssistantService.java` — llama a Gemini por HTTP
    con `RestClient`; arma el system prompt con los datos de la reserva.
  - `infrastructure/web/controller/AssistantController.java` →
    `POST /v1/assistant/chat` (público).
- **Frontend:**
  - `services/assistantService.ts` — servicio del asistente.
  - `components/ui/ReservationAssistant.tsx` — widget flotante con barra
    fija de acciones rápidas (Estado, Pago, Comprobante, Alergias, Otra
    reserva). No repite el menú en cada respuesta. Botón flotante
    rediseñado.

### S12-05 · Estado de pago en la reserva

- **Backend:**
  - Estados: `PENDING_PAYMENT` / `PAYMENT_UPLOADED` / `PAYMENT_VERIFIED` /
    `PAYMENT_REJECTED`.
  - `ReservationService` actualiza el estado según la acción del pago.

### S12-06 · QR de pago del restaurante

El dueño sube su QR (Yape/Plin) para que los clientes sepan dónde pagar.

- **Backend:**
  - Migración `V20__payment_qr.sql` — campo `payment_qr_url` en
    `reservation_config`.
  - Se sube a Cloudinary (carpeta `payment-qr`).
- **Frontend:**
  - Opción de subir QR en "Reglas de reserva".
  - Se muestra en: asistente, correo de reserva y página `/reservations`.

---

## Funcionalidades adicionales de la Etapa 3

### Registro y login mejorados (cuentas de restaurante con aprobación)

**Regla:** el registro por formulario es solo para dueños de restaurante.
Los clientes se registran/ingresan solo con Google.

**Flujo:** el dueño solicita su cuenta (datos del dueño + restaurante) →
queda en revisión → el admin revisa y aprueba o rechaza → correos
automáticos en cada paso.

- **Backend:**
  - Migración `V21__owner_account_status.sql` — campo `account_status` en
    `users` (`ACTIVE` / `PENDING_REVIEW` / `REJECTED`).
  - Enum `domain/model/enums/AccountStatus.java`.
  - `RegisterOwnerRequest` — datos del dueño + `CreateRestaurantRequest`
    anidado.
  - `AuthService.registerOwner()` — crea dueño `PENDING_REVIEW` +
    restaurante `PENDING_APPROVAL`, envía correo.
  - `AuthService.login()` — mensajes de estado según `accountStatus`.
  - `AuthController` → `POST /v1/auth/register-owner` (público).
  - `AccountNotActiveException` → HTTP 403 (`GlobalExceptionHandler`).
  - `application/service/RegistrationReviewService.java` — lógica de
    aprobación/rechazo.
  - `infrastructure/web/controller/AdminRegistrationController.java`:
    - `GET /v1/admin/registration-requests`
    - `POST /v1/admin/registration-requests/{userId}/approve`
    - `POST /v1/admin/registration-requests/{userId}/reject`
  - Correos: `sendOwnerApplicationReceived`, `sendOwnerApplicationApproved`,
    `sendOwnerApplicationRejected`.
- **Frontend:**
  - `app/(auth)/register/page.tsx` — asistente de 2 pasos (Tu cuenta → Tu
    restaurante) + pantalla "Solicitud recibida" (sin auto-login).
  - `app/(auth)/login/page.tsx` — aclara que el registro es para
    restaurantes; los clientes usan Google.
  - `app/dashboard/solicitudes/page.tsx` — panel de solicitudes (solo admin).
  - `services/adminRegistrationService.ts` — servicio de solicitudes.
  - Nuevo ítem `registrationRequests` en el sidebar (solo admin).
  - `authService.registerOwner()`.

### Onboarding mejorado (guías interactivas)

Motor reutilizable con spotlight que no tapa el elemento resaltado.

- **Frontend:**
  - `components/ui/SpotlightTour.tsx` — motor reutilizable; tarjeta al lado
    del elemento resaltado; responsive.
  - `components/ui/OnboardingTour.tsx` — tour del cliente (filtros, listado,
    asistente).
  - `components/ui/OwnerOnboardingTour.tsx` — tour del dueño (sidebar:
    restaurante, menús, promociones, reglas de reserva y pagos, reservas,
    reportes).
  - Ítems del sidebar marcados con `data-tour="nav-<clave>"`.

### Ofertas con flyer (IA) en la página principal

Carrusel de ofertas con flyers generados por IA.

- **Backend:**
  - Migración `V22__promotion_flyer.sql` — campos `flyer_headline` y
    `flyer_tagline` en `promotions`.
  - `GeminiTextClient` — genera copy (titular + subtítulo) con Gemini.
  - `PromotionService.generateFlyer()` — genera flyer; si la IA no está
    disponible usa título/descripción como fallback.
  - `PromotionService.showcase()` — obtiene promociones activas con flyer.
  - Endpoints:
    - `POST /v1/promotions/{id}/flyer` (dueño).
    - `GET /v1/promotions/showcase` (público).
- **Frontend:**
  - `components/ui/OffersCarousel.tsx` — carrusel de ofertas en
    `/restaurants` con flechas ◀ ▶, responsive y dark mode.
  - `components/ui/PromoFlyer.tsx` — diseño del flyer (el sistema diseña,
    la IA genera el copy).
  - Botón "Generar flyer" en el panel de Promociones con vista previa.

### Otros ajustes

- **Sidebar:** más compacto; ya no muestra scroll innecesario.
- **"Reglas de reserva":** botón Guardar con estado *dirty* + aviso "Tienes
  cambios sin guardar". El selector de restaurante usa `RestaurantPicker`.
- **QR de pago:** el dueño sube su QR (Yape/Plin) en "Reglas de reserva"
  (Cloudinary, carpeta `payment-qr`); se muestra en asistente, correo y
  página de la reserva.

---

## Resumen de migraciones

| Versión | Archivo | Etapa | Cambio |
|---------|---------|-------|--------|
| V5 | `V5__schedules_nullable_times.sql` | E2 | Horarios con tiempos opcionales |
| V6 | `V6__seed_images.sql` | E2 | Seed de imágenes para restaurantes |
| V7 | `V7__add_price_level.sql` | E2 | Campo `price_level` en restaurantes |
| V8 | `V8__fix_promotion_types.sql` | E2 | Ajuste de tipos de promoción |
| V9 | `V9__restaurant_holidays.sql` | E2 | Tabla `restaurant_holidays` |
| V10 | `V10__sections_and_tables.sql` | E2 | Tablas `restaurant_sections` y `restaurant_tables` |
| V11 | `V11__restore_reservation_table_fk.sql` | E2 | FK de reserva a mesa |
| V12 | `V12__rating_owner_reply.sql` | E2 | Campo `owner_reply` en `ratings` |
| V13 | `V13__avg_dish_price.sql` | E2 | Campo `avg_dish_price` en `restaurants` |
| V14 | `V14__customer_favorites.sql` | E2 | Tabla `customer_favorites` |
| V15 | `V15__google_oauth_users.sql` | E3 | Campos Google OAuth en `users` |
| V16 | `V16__reservation_section.sql` | E3 | Campo `section_id` en `reservations` |
| V17 | `V17__reservation_config_and_waitlist.sql` | E3 | Tablas `reservation_config` y `waitlist_entries` |
| V18 | `V18__reservation_order_items.sql` | E3 | Tabla `reservation_order_items` |
| V19 | `V19__payments.sql` | E3 | Tabla `payments` |
| V20 | `V20__payment_qr.sql` | E3 | Campo `payment_qr_url` en config |
| V21 | `V21__owner_account_status.sql` | E3 | Campo `account_status` en `users` |
| V22 | `V22__promotion_flyer.sql` | E3 | Campos `flyer_headline`, `flyer_tagline` en `promotions` |

## Variables de entorno nuevas

| Variable | Etapa | Uso |
|----------|-------|-----|
| `CLOUDINARY_CLOUD_NAME` | E2 | Nombre del cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | E2 | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | E2 | API secret de Cloudinary |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | E2 | API key de Google Maps (frontend) |
| `GOOGLE_CLIENT_ID` | E3 | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | E3 | Client secret de Google OAuth |
| `GEMINI_API_KEY` | E3 | API key de Google AI Studio (asistente IA). Vacía = modo reglas |
| `GEMINI_MODEL` | E3 | Modelo de Gemini (por defecto `gemini-2.5-flash-lite`) |

## Endpoints nuevos

### Etapa 2

| Método | Ruta | Acceso | Sprint |
|--------|------|--------|--------|
| POST | `/v1/images/sign` | OWNER / ADMIN | S5 |
| GET | `/v1/geo/nearby` | público | S6 |
| POST | `/v1/restaurants/{id}/sections` | OWNER / ADMIN | S7 |
| GET | `/v1/restaurants/{id}/sections` | público | S7 |
| PUT | `/v1/sections/{id}` | OWNER / ADMIN | S7 |
| DELETE | `/v1/sections/{id}` | OWNER / ADMIN | S7 |
| POST | `/v1/sections/{id}/tables` | OWNER / ADMIN | S7 |
| PUT | `/v1/tables/{id}` | OWNER / ADMIN | S7 |
| DELETE | `/v1/tables/{id}` | OWNER / ADMIN | S7 |
| GET | `/v1/categories` | público | S7 |
| POST | `/v1/categories` | ADMIN | S7 |
| GET | `/v1/restaurants/{id}/holidays` | público | S7 |
| POST | `/v1/restaurants/{id}/holidays` | OWNER / ADMIN | S7 |
| PUT | `/v1/holidays/{id}` | OWNER / ADMIN | S7 |
| DELETE | `/v1/holidays/{id}` | OWNER / ADMIN | S7 |
| POST | `/v1/ratings/{id}/reply` | OWNER / ADMIN | S7 |
| GET | `/v1/favorites` | autenticado | S8 |
| POST | `/v1/favorites/{restaurantId}` | autenticado | S8 |
| DELETE | `/v1/favorites/{restaurantId}` | autenticado | S8 |

### Etapa 3

| Método | Ruta | Acceso | Sprint |
|--------|------|--------|--------|
| POST | `/v1/auth/google` | público | S9 |
| GET | `/v1/reservation-config/restaurant/{id}` | OWNER / ADMIN | S10 |
| PUT | `/v1/reservation-config/restaurant/{id}` | OWNER / ADMIN | S10 |
| POST | `/v1/waitlist` | autenticado | S11 |
| GET | `/v1/waitlist/restaurant/{id}` | OWNER / ADMIN | S11 |
| DELETE | `/v1/waitlist/{id}` | autenticado | S11 |
| POST | `/v1/payments/proof` | autenticado | S12 |
| PATCH | `/v1/payments/{id}/verify` | OWNER / ADMIN | S12 |
| PATCH | `/v1/payments/{id}/reject` | ADMIN / OWNER | S12 |
| GET | `/v1/payments/restaurant/{id}` | OWNER / ADMIN | S12 |
| POST | `/v1/assistant/chat` | público | S12 |
| POST | `/v1/auth/register-owner` | público | Extra |
| GET | `/v1/admin/registration-requests` | ADMIN | Extra |
| POST | `/v1/admin/registration-requests/{userId}/approve` | ADMIN | Extra |
| POST | `/v1/admin/registration-requests/{userId}/reject` | ADMIN | Extra |
| POST | `/v1/promotions/{id}/flyer` | OWNER / ADMIN | Extra |
| GET | `/v1/promotions/showcase` | público | Extra |

## Limitaciones conocidas

- El regex de teléfono del backend exige 10-12 dígitos, por lo que un móvil
  peruano de 9 dígitos se rechaza. Por eso el teléfono es **opcional** en el
  registro. Pendiente: relajar el patrón a 9 dígitos.
- La Etapa 3 en las notas de Obsidian figura como "pendiente" pero todos los
  sprints (S9-S12) ya están implementados en el código fuente.
