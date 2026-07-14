# Informe de Evaluación de la Calidad de un Sistema de Software para Restaurantes
## Basado en el modelo de calidad de producto ISO/IEC 25010 y las métricas de ISO/IEC 25023

---

## 1. Introducción

Un sistema de software para restaurantes (gestión de pedidos, reservas,
disponibilidad de mesas e integración con plataformas de delivery, turismo o
transporte) casi nunca funciona de forma aislada. En la práctica forma parte
de un ecosistema donde otros programas necesitan consumir su información y
donde se espera que permanezca operativo casi todo el tiempo, porque una
caída durante el servicio de almuerzo o cena tiene un costo directo en
ventas. Evaluar la calidad de este tipo de software, entonces, no se reduce
a comprobar que las funcionalidades existen: hay que medir qué tan bien
intercambia información con otros sistemas, cuánto tiempo permanece
disponible y qué tan bien reacciona cuando algo sale mal.

Este documento describe cómo se puede evaluar esa calidad usando el modelo
de producto de la norma **ISO/IEC 25010** y las medidas concretas que
propone su complemento, **ISO/IEC 25023**, aplicadas a tres características
especialmente relevantes para este tipo de sistema: interoperabilidad,
disponibilidad y tolerancia a fallos. El enfoque que se presenta es
reproducible con herramientas simples y puede adaptarse a cualquier software
de gestión de restaurantes, independientemente de su tecnología.

---

## 2. Objetivos

### 2.1 Objetivo general

- Evaluar la calidad de un sistema de software de gestión de restaurantes a
  través de métricas cuantitativas estandarizadas, que permitan determinar
  de forma objetiva su nivel de interoperabilidad, disponibilidad y
  tolerancia a fallos.

### 2.2 Objetivos específicos

- Definir, para cada característica de calidad evaluada, las medidas
  aplicables según ISO/IEC 25023 y su fórmula de cálculo.
- Diseñar instrumentos de medición (scripts o herramientas equivalentes) que
  actúen como un cliente externo real del sistema, sin depender de
  herramientas comerciales.
- Ejecutar las mediciones en un entorno controlado y, cuando sea posible,
  también en producción, dejando registrada la evidencia de cada una en un
  formato reutilizable para su análisis posterior.
- Identificar, a partir de los resultados obtenidos, hallazgos y
  oportunidades de mejora que puedan verificarse con una segunda medición.

---

## 3. Marco de referencia

La ISO/IEC 25010 define el modelo de calidad de producto: las
características (Compatibilidad, Fiabilidad, entre otras) y sus
subcaracterísticas, en este caso Interoperabilidad, Disponibilidad y
Tolerancia a fallos. La ISO/IEC 25023, en cambio, es la norma que traduce
esas subcaracterísticas en medidas concretas: qué se mide, con qué fórmula y
cómo se interpreta el resultado.

| Norma | Uso en este trabajo |
|---|---|
| ISO/IEC 25010 | Modelo de calidad: características y subcaracterísticas evaluadas. |
| ISO/IEC 25023 | Medidas de calidad: fórmula y forma de interpretar cada resultado. |

La mayoría de las medidas siguen la forma `X = A / B`, donde A es la
cantidad de elementos que cumplen el criterio evaluado y B es el total de
elementos especificados. Un resultado de 1.0 indica cumplimiento total;
cualquier valor menor indica un incumplimiento proporcional. Las medidas de
tiempo (tiempo medio de inactividad, tiempo medio de notificación de fallo)
se leen al revés: entre más bajas, mejor.

---

## 4. Métricas evaluadas

### 4.1 Compatibilidad: Interoperabilidad (ISO/IEC 25023, Tabla 8)

Esta subcaracterística mide qué tan bien el sistema intercambia información
con otros sistemas del ecosistema. En un software de restaurantes, los
"otros sistemas" suelen ser agregadores de delivery (Rappi, Uber Eats,
PedidosYa, entre otros), pasarelas de pago para cobros desde la mesa o en
pedidos en línea, el sistema de facturación electrónica que recibe la
comanda para emitir el comprobante fiscal, y en algunos casos plataformas
turísticas o de reservas que consultan el catálogo y la disponibilidad del
restaurante.

| Medida | Pregunta que responde |
|---|---|
| **CIn-1-G** — Intercambiabilidad de formatos de datos | ¿Qué proporción de los formatos de datos especificados (JSON con estructura estándar, contrato OpenAPI, tokens de autenticación) es realmente intercambiable con otro software? |
| **CIn-2-G** — Suficiencia del protocolo de intercambio | ¿Qué proporción de los protocolos especificados (REST sobre HTTP, autenticación por token, CORS, HTTPS) está efectivamente soportada? |
| **CIn-3-S** — Adecuación de interfaces externas | ¿Qué proporción de las interfaces (endpoints) expuestas a otros sistemas funciona correctamente? |

El criterio de éxito de cada medida se fija antes de medir, no se
interpreta después. En **CIn-1-G**, A es el número de formatos (JSON con la
estructura acordada, contrato OpenAPI, token de autenticación) que el
sistema genera o interpreta sin errores de parseo, sobre el total
especificado (B). En **CIn-2-G**, A es el número de protocolos (REST/HTTP,
autenticación por token, CORS, HTTPS) verificados como soportados, sobre el
total especificado (B). En **CIn-3-S**, A es el número de interfaces que
responden con el código HTTP correcto —2xx en el caso feliz, 4xx controlado
ante una entrada inválida— sobre el total de interfaces expuestas a otros
sistemas (B); este denominador incluye tanto los endpoints que el sistema
expone para ser consultados (*polling*) como los que recibe en forma de
**webhook** o callback desde agregadores de delivery y pasarelas de pago, ya
que ambos son mecanismos de integración válidos en este dominio.

### 4.2 Fiabilidad: Disponibilidad (ISO/IEC 25023, Tabla 16)

La disponibilidad mide la proporción del tiempo en que el sistema está
operativo y accesible cuando se necesita usarlo. Para un restaurante que
opera con un sistema en la nube, toda interrupción afecta por igual a los
locales que dependen de él, pero su costo real no es el mismo en cualquier
momento: una caída durante la madrugada pasa casi desapercibida, mientras
que la misma interrupción en hora de almuerzo o cena puede significar
pedidos perdidos y clientes molestos.

| Medida | Pregunta que responde |
|---|---|
| **RAv-1-G** — Disponibilidad del sistema | ¿Durante qué proporción del tiempo programado de operación el sistema estuvo realmente disponible? |
| **RAv-2-G** — Tiempo medio de inactividad | ¿Cuánto dura, en promedio, cada episodio de indisponibilidad? |

En **RAv-1-G**, A es el tiempo durante el que la sonda de salud confirmó
disponibilidad (derivado del número de muestras que reportaron el sistema
operativo, multiplicado por el intervalo de muestreo), y B es la duración
total de la ventana de observación programada. En **RAv-2-G**, A es la suma
de la duración de todos los episodios de caída detectados durante esa
ventana y B es el número de esos episodios; el resultado es el tiempo
promedio que dura cada interrupción.

### 4.3 Fiabilidad: Tolerancia a fallos (ISO/IEC 25023, Tabla 17)

Esta subcaracterística mide si el sistema sigue operando según lo previsto
frente a entradas o condiciones anómalas, sin caerse ni devolver errores sin
control.

| Medida | Pregunta que responde |
|---|---|
| **RFt-1-G** — Evitación de fallos | ¿Qué proporción de los patrones de fallo probados fue controlada sin producir errores graves? |
| **RFt-2-S** — Redundancia de componentes | ¿Qué proporción de los componentes del sistema cuenta con redundancia? |
| **RFt-3-S** — Tiempo medio de notificación de fallo | ¿Con qué rapidez el sistema informa que ocurrió un fallo a quien lo consume? |

Además de los patrones genéricos de validación (JSON malformado, tipos de
dato inválidos, fallas de autenticación), en el dominio de restaurantes los
casos de prueba incluyen condiciones propias de la operación diaria: dos
clientes reservando la misma mesa en el mismo turno casi al mismo tiempo,
donde se espera que uno tenga éxito y el otro reciba un conflicto controlado
en vez de una doble reserva silenciosa o un error interno; cantidades
negativas o desproporcionadas en un pedido, o precios en cero; y fallos de
las integraciones externas, como que la pasarela de pago responda con error
o se demore demasiado, caso en el que el sistema debe informarle al cliente
en vez de dejar el pedido en un estado ambiguo.

**Definición del criterio de éxito (A y B).** En **RFt-1-G**, A es el número
de casos de patrón de fallo inyectados que el sistema controla devolviendo
un error 4xx estructurado —nunca un 5xx ni una caída de la conexión— y B es
el total de casos ejecutados. En **RFt-2-S**, A es el número de componentes
desplegados que cuentan con alguna forma de redundancia (réplicas propias o
un servicio gestionado con redundancia administrada) y B es el total de
componentes que conforman el sistema.

**RFt-3-S**, en cambio, se calcula con la siguiente función de medición:

$$\text{RFt-3-S} = \frac{1}{n} \sum_{i=1}^{n} (A_i - B_i)$$

donde:

- ***i*** es el índice del caso de prueba (*i* = 1, 2, …, *n*).
- ***n*** es el número total de pruebas de fallo ejecutadas.
- ***Bi*** es el instante en que el instrumento de medición envía la
  petición anómala del caso *i* al servidor.
- ***Ai*** es el instante en que llega la respuesta de error correspondiente
  a ese mismo caso.

El resultado se expresa en milisegundos o segundos, según la resolución del
cronómetro usado; cuanto más cerca de 0, mejor.

### 4.4 Criterios de aceptación y umbrales de calidad

Un valor de X aislado no dice por sí solo si el sistema está listo para
producción: hace falta un umbral de referencia que indique cuándo el
resultado es excelente, cuándo es apenas aceptable y cuándo es crítico. Los
umbrales de disponibilidad de la tabla siguiente se basan en la convención
de "nueves" de disponibilidad usada en ingeniería de confiabilidad de sitios
(Beyer et al., 2016) y en los objetivos de disponibilidad publicados por
proveedores de nube de referencia (Amazon Web Services, 2023; Microsoft,
2023): 99.9 % es un nivel de SLA comercial estándar, y 99.99 % o más se
considera alta disponibilidad. Los umbrales de las medidas de
interoperabilidad y tolerancia a fallos (CIn, RFt) son propuestos por los
autores de este trabajo —no derivan de un estándar publicado—, partiendo
del criterio de que en este dominio cualquier incumplimiento de una
interfaz de integración o del manejo de errores tiene una consecuencia de
negocio directa (un pedido que no llega, una transacción que no concilia).
Cada equipo debe ajustar estos valores al nivel de servicio (SLA) que haya
comprometido con el negocio.

| Medida | Fórmula | Excelente | Aceptable | Crítico | Justificación en el dominio |
|---|---|---|---|---|---|
| CIn-1-G (formatos de datos) | X = A / B | 1.0 | ≥ 0.90 | < 0.90 | Un formato no intercambiable puede hacer que un pedido de delivery nunca llegue a procesarse. |
| CIn-2-G (protocolos de intercambio) | X = A / B | 1.0 | ≥ 0.90 | < 0.90 | Un protocolo no soportado (por ejemplo, HTTPS) impide la conexión de un sistema externo por completo. |
| CIn-3-S (interfaces externas) | X = A / B | 1.0 | ≥ 0.95 | < 0.95 | Si el endpoint que confirma un pago o una reserva no es funcional, se generan descuadres de caja o reservas perdidas. |
| RAv-1-G (disponibilidad) | X = A / B | ≥ 0.999 | ≥ 0.990 | < 0.990 | 0.990 de disponibilidad en un mes equivale a unas 7 horas de caída; si coinciden con una hora pico, el impacto en ventas es alto. |
| RAv-2-G (tiempo medio de inactividad) | X = A / B (s por fallo) | < 5 min | 5–15 min | > 15 min | Una caída de más de 15 minutos durante el servicio suele obligar a operar de forma manual. |
| RFt-1-G (evitación de fallos) | X = A / B | 1.0 | ≥ 0.90 | < 0.90 | Cualquier error 5xx no controlado puede exponer detalles internos o interrumpir la sesión del cliente o del mesero. |
| RFt-3-S (tiempo de notificación de fallo) | X = (1/n)·Σ(Ai−Bi) | < 200 ms | 200–800 ms | > 800 ms | Una app de mesero o un totem de autoservicio necesita respuesta casi inmediata para evitar que el usuario duplique el pedido. |

> RFt-2-S no se incluye en la tabla porque su nivel aceptable depende
> directamente de la arquitectura de despliegue contratada (por ejemplo, un
> plan gratuito de un solo nodo frente a uno con réplicas gestionadas), y
> debe evaluarse caso por caso.

---

## 5. Metodología e instrumentos

### 5.1 Enfoque general

El enfoque adoptado es de caja negra: los instrumentos de medición actúan
como un cliente externo real que consume la API del sistema, de la misma
forma en que lo haría una app de reservas o una plataforma de delivery. No
se examina el código interno, sino el comportamiento observable desde
afuera, que es en definitiva lo que determina la calidad que perciben los
sistemas que se integran con él.

### 5.2 Herramientas utilizadas

Se priorizaron herramientas nativas del sistema operativo y de la
plataforma de despliegue, de modo que cualquier integrante del equipo pueda
repetir la medición sin instalar software adicional.

| Herramienta o técnica | Rol en la medición |
|---|---|
| Scripts de automatización (PowerShell, Bash o Python) | Ejecutan las pruebas, capturan las respuestas y calculan A, B y X. |
| Cliente HTTP (`Invoke-WebRequest`, `curl`, Postman/Newman) | Simula al sistema externo que consume la API; captura estado, cuerpo y cabeceras incluso en respuestas de error. |
| Cronómetro de alta resolución (`Stopwatch`, `time.perf_counter`) | Mide latencias y tiempos de notificación de fallo en milisegundos. |
| Orquestador de contenedores (Docker / Docker Compose) | Levanta el sistema en un entorno controlado y permite inyectar averías (detener y reiniciar un servicio) e inventariar componentes y réplicas. |
| Endpoint de salud (health check) | Sonda usada para el monitoreo continuo de disponibilidad. |
| Contrato de API (OpenAPI/Swagger) | Verifica que el contrato de integración publicado sea válido y consumible. |
| Hoja de cálculo y archivos CSV | Consolidan y presentan los resultados finales (A, B, X e interpretación por medida). |

Deliberadamente no se usaron herramientas comerciales de pruebas de carga o
interoperabilidad (JMeter, SoapUI y similares): la idea es mostrar que estas
mediciones se pueden obtener con herramientas estándar y de bajo costo,
siempre que el sistema exponga puntos de verificación claros, como un
contrato de API, un endpoint de salud y un manejo de errores bien
estructurado.

### 5.3 Entornos de medición

La metodología define dos entornos de medición. Uno local o de pruebas,
levantado por ejemplo con Docker Compose, donde se provocan fallos de forma
controlada sin afectar a usuarios reales; ahí se ejecutan las pruebas de
tolerancia a fallos y de interoperabilidad. Y uno de producción, donde solo
se observa pasivamente, sin provocar averías, para medir la disponibilidad
tal como la perciben los usuarios y sistemas reales que dependen del
servicio.

### 5.4 Procedimiento general

El procedimiento parte de levantar o identificar el sistema bajo prueba y
confirmar que está operativo. Para interoperabilidad, se identifican los
formatos, protocolos e interfaces externas especificadas en la
documentación del contrato de API y se verifican una por una con el cliente
HTTP. Para disponibilidad, se monitorea un endpoint de salud a intervalos
regulares durante una ventana de tiempo definida, registrando cada muestra,
y se provoca al menos una caída controlada para poder calcular el tiempo
medio de inactividad. Para tolerancia a fallos, se define un conjunto de
casos que representen patrones de fallo típicos y se inyectan uno por uno,
verificando que la respuesta sea un error controlado y no una caída del
sistema. Con esos datos se calcula A, B y X para cada medida, documentando
la evidencia que sustenta cada valor, y finalmente se vuelca todo a una
plantilla de hoja de cálculo para su presentación.

### 5.5 Formato de evidencia

Para que la evidencia de tolerancia a fallos sea trazable y fácil de
auditar, cada caso se registra con la siguiente estructura:

| ID caso | Componente evaluado | Acción de prueba | Estímulo / entrada anómala | Comportamiento esperado | Resultado real | Estado |
|---|---|---|---|---|---|---|
| TC-01 | Integración de pagos | Cobro de un pedido | Monto del ítem en $0.00 | 400 Bad Request controlado | 400 con mensaje descriptivo | OK |
| TC-02 | Reservas | Reserva de mesa | Dos peticiones concurrentes para la misma mesa y turno | Una exitosa, otra con 409 controlado | 500 (excepción de base de datos no controlada) | Falla |
| TC-03 | Menú digital | Carga de imagen de un platillo | Archivo de 50 MB | 413 Payload Too Large | Timeout de conexión (servicio colgado) | Falla |

Cada fila alimenta directamente el conteo de A y B de RFt-1-G, y la columna
de evidencia —estado HTTP real, capturas, marcas de tiempo— respalda el
resultado ante una revisión posterior.

---

## 6. Recomendaciones de aplicación

Además del procedimiento descrito en la sección 5, la aplicación de esta
metodología a un caso concreto se beneficia de las siguientes
recomendaciones prácticas. A diferencia de la metodología, que describe lo
que se hace, esta sección reúne sugerencias sobre cómo ajustar la medición
al contexto de cada equipo.

- Al definir el tiempo de operación programado (B) de RAv-1-G, conviene
  pensarlo en función de las franjas de mayor actividad del negocio
  —almuerzo, cena, fines de semana— en lugar de tratarlo como una ventana
  uniforme de 24 horas, ya que el costo de una caída no es el mismo en
  cualquier momento del día.
- La sonda usada para monitorear la disponibilidad no debería limitarse a
  confirmar que el proceso sigue vivo: conviene que verifique también sus
  dependencias críticas (conexión a la base de datos de pedidos, a la
  pasarela de pagos), de modo que el resultado refleje disponibilidad
  funcional real.
- Los umbrales de la sección 4.4 son un punto de partida informado por
  prácticas de la industria, no un estándar obligatorio: cada equipo
  debería recalibrarlos según el nivel de servicio (SLA) acordado con el
  negocio antes de usarlos como criterio de aceptación formal.
- En los instrumentos de medición de RFt-3-S, se recomienda asignar una
  latencia de penalización explícita (por ejemplo, el valor del propio
  timeout) a los casos sin respuesta, en vez de excluirlos del promedio:
  así el resultado no mejora artificialmente cuando ocurre justamente el
  tipo de falla más severo.
- Las restricciones propias del entorno de despliegue —por ejemplo, que un
  plan de nube gratuito ponga el servicio a dormir por inactividad—
  conviene documentarlas por separado de los resultados de disponibilidad,
  para no atribuirle al sistema una falla que en realidad es una condición
  del proveedor.

---

## 7. Matriz de trazabilidad

La siguiente matriz conecta cada objetivo específico (sección 2.2) con la
métrica que lo opera, el instrumento que la mide, el resultado esperado de
esa medición y la conclusión de la sección 10 que ese resultado sustenta. Su
propósito es que cualquier lector pueda verificar que ninguna conclusión
quedó sin respaldo en un objetivo, una métrica y un instrumento concretos.

| Objetivo específico | Métrica(s) | Instrumento | Resultado esperado | Conclusión |
|---|---|---|---|---|
| 1. Definir medidas y fórmulas (2.2) | CIn-1/2/3, RAv-1/2, RFt-1/2/3 | Marco ISO/IEC 25023 (secciones 3–4) | Fórmula y criterio de éxito documentados para cada medida | Conclusión 1 |
| 2. Diseñar instrumentos sin herramientas comerciales (2.2) | Todas | Scripts + cliente HTTP + cronómetro + contenedores (5.2) | Medición reproducible sin licencias comerciales | Conclusión 2 |
| 3. Ejecutar en entorno controlado y producción (2.2) | RAv-1/2 (ambos entornos); CIn, RFt (entorno controlado) | Docker Compose + endpoint de salud + CSV (5.3–5.5) | Evidencia trazable en archivos de resultados | Conclusión 3 |
| 4. Identificar hallazgos y oportunidades de mejora (2.2) | Principalmente RFt-1-G | Segunda medición tras aplicar una corrección | Mejora verificable del valor de X entre la primera y la segunda medición | Conclusión 4 |

> Elaboración propia. Los números de conclusión remiten a los cuatro puntos
> de la sección 10.

---

## 8. Hallazgos esperados

Las observaciones de esta sección no provienen de la ejecución de esta
metodología sobre un sistema específico: son **hallazgos esperados**, es
decir, hipótesis fundamentadas en la literatura de ingeniería de software y
en la práctica documentada de integración de sistemas, diseño de APIs y
confiabilidad. Un equipo que ejecute esta metodología sobre su propio
sistema debe contrastar estos hallazgos esperados con sus resultados reales,
y reemplazar esta sección por lo que efectivamente observó.

Sobre interoperabilidad, la literatura de diseño de APIs REST (Fielding,
2000; Newman, 2021) documenta que las fallas de interoperabilidad ocurren
con más frecuencia en el manejo de parámetros límite —identificadores
inválidos, recursos inexistentes— que en el camino feliz de la petición; es
razonable esperar que un sistema sin este aspecto específicamente probado
presente el mismo patrón.

Sobre tolerancia a fallos, tanto la literatura sobre diseño de software
resiliente (Nygard, 2018) como el patrón de *circuit breaker* (Fowler, 2014)
parten de la premisa de que el manejo de excepciones no cubierto
explícitamente por el equipo de desarrollo tiende a degradar en errores de
servidor (5xx) en lugar de respuestas controladas; por eso es esperable que
una primera medición de RFt-1-G revele varios casos no controlados, y que
agregar manejo explícito de excepciones para esos casos mejore el resultado
en una segunda medición.

Sobre disponibilidad, la práctica de ingeniería de confiabilidad de sitios
(Beyer et al., 2016) enfatiza medir el servicio durante los periodos de
mayor tráfico real, ya que es en esos periodos donde una interrupción tiene
el mayor costo y donde suelen aparecer picos de latencia que no llegan a una
caída total pero sí degradan la experiencia del usuario.

Sobre redundancia de componentes, la literatura de arquitectura de software
describe la redundancia como una de las tácticas de diseño más comunes para
mejorar la disponibilidad (Bass et al., 2021); es esperable que un entorno
de pruebas de una sola instancia por servicio arroje RFt-2-S = 0 por diseño,
mientras que un entorno de producción con servicios gestionados (bases de
datos replicadas, CDN) sí aporte redundancia real.

---

## 9. Amenazas a la validez

Siguiendo la clasificación estándar de amenazas a la validez en estudios
empíricos de ingeniería de software (Wohlin et al., 2012), se distinguen
cuatro categorías aplicables a esta metodología.

### 9.1 Validez de constructo

Existe un punto ciego metodológico en RAv-1-G debido a la naturaleza
discreta del monitoreo: si el sistema se cae y se recupera por completo
entre dos muestras consecutivas —por ejemplo, con un intervalo de sondeo de
5 minutos, una caída que ocurre en el minuto 2 y se resuelve en el minuto
4—, ambas muestras registrarán el sistema como operativo y el episodio de
indisponibilidad no quedará reflejado en el resultado, lo que genera una
sobreestimación marginal de la disponibilidad real. De forma similar, si el
endpoint de salud no verifica las dependencias críticas del sistema,
RAv-1-G puede estar midiendo disponibilidad del proceso en lugar de
disponibilidad funcional, que es el constructo que en realidad interesa
evaluar.

### 9.2 Validez interna

El número reducido de casos de prueba por medida —tres en cada medida de
interoperabilidad, doce en tolerancia a fallos— limita la representatividad
estadística de cada valor de X: un solo caso mal diseñado puede mover el
resultado en varios puntos porcentuales. Además, si los casos de prueba
comparten estado (por ejemplo, datos creados por un caso que afectan al
siguiente), el orden de ejecución podría introducir un sesgo no controlado
en el resultado.

### 9.3 Validez externa

Las pruebas se ejecutan en un entorno controlado (típicamente Docker
Compose local) con una carga sintética mínima —una petición a la vez, sin
usuarios concurrentes—, y no incluyen pruebas bajo carga real ni con el
volumen de tráfico simultáneo de múltiples restaurantes en producción. Por
lo tanto, los resultados obtenidos en este entorno no necesariamente
generalizan a las condiciones de uso real a gran escala, donde la
concurrencia puede exponer fallas de tolerancia a fallos o de disponibilidad
que no aparecen con una sola petición a la vez.

### 9.4 Validez de conclusión

La resolución temporal de RAv-1-G y RAv-2-G depende directamente del
intervalo de muestreo del monitoreo, discutido como amenaza a la validez de
constructo en 9.1; a menor intervalo, mayor precisión pero también mayor
consumo de recursos. Además, esta metodología no contempla, por defecto,
más de una ejecución por medida —salvo la segunda medición de RFt-1-G tras
aplicar una corrección—, por lo que no es posible calcular variabilidad ni
un intervalo de confianza sobre el valor de X reportado; una diferencia
entre dos ejecuciones podría deberse tanto a una mejora real como a ruido de
medición. Por último, en entornos de nube con planes gratuitos, el propio
proveedor puede introducir variables externas —por ejemplo, poner a dormir
el servicio por inactividad— que se confunden con la disponibilidad real
del sistema si no se documentan por separado.

---

## 10. Conclusiones

A diferencia de un resumen de actividades, las conclusiones que siguen
buscan responder **qué se aprendió** al aplicar esta metodología,
organizadas según los cuatro objetivos específicos de la sección 2.2 y
sustentadas en la matriz de trazabilidad de la sección 7.

- **Conclusión 1.** Las funciones de medición de ISO/IEC 25023 permiten
  operacionalizar las subcaracterísticas de ISO/IEC 25010 mediante
  indicadores objetivos (X = A / B, o un promedio de tiempos en el caso de
  RFt-3-S), lo que facilita evaluaciones repetibles de interoperabilidad,
  disponibilidad y tolerancia a fallos independientemente de la tecnología
  o el proveedor de nube utilizado.
- **Conclusión 2.** La automatización de estas mediciones no requiere
  herramientas comerciales de pruebas: un cliente HTTP, un cronómetro y un
  orquestador de contenedores bastan para producir evidencia auditable, lo
  que hace que este tipo de evaluación de calidad sea accesible incluso
  para equipos pequeños sin presupuesto para licencias.
- **Conclusión 3.** Medir en un entorno controlado permite aislar la causa
  de un resultado —por ejemplo, distinguir una falla del sistema de una
  restricción del proveedor de nube—, mientras que medir en producción es
  indispensable para conocer la disponibilidad real percibida por el
  usuario; ninguno de los dos entornos por sí solo es suficiente.
- **Conclusión 4.** El valor de estas métricas no está en el número que
  arrojan en un instante dado, sino en su capacidad de guiar una corrección
  concreta y de verificar, con una segunda medición, si esa corrección
  realmente funcionó; sin esa segunda medición, la métrica se queda en un
  diagnóstico sin cierre.

En conjunto, estos hallazgos indican que ISO/IEC 25023 ofrece un marco de
medición operativo y de bajo costo para sistemas de gestión de
restaurantes, aunque su valor depende de que cada equipo lo ejecute más de
una vez —antes y después de una corrección— y lo complemente con pruebas
bajo carga real antes de generalizar sus resultados a un entorno de
producción a gran escala (véase la sección 9.3).

---

## 11. Referencias

- Amazon Web Services. (2023). *Reliability pillar*. AWS Well-Architected
  Framework.
  https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html
- Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in
  practice* (4th ed.). Addison-Wesley.
- Beyer, B., Jones, C., Petoff, J., & Murphy, N. R. (Eds.). (2016). *Site
  reliability engineering: How Google runs production systems*. O'Reilly
  Media.
- Fielding, R. T. (2000). *Architectural styles and the design of
  network-based software architectures* [Tesis doctoral, University of
  California, Irvine].
- Fowler, M. (2014). *CircuitBreaker*. martinfowler.com.
  https://martinfowler.com/bliki/CircuitBreaker.html
- International Organization for Standardization. (2011). *Systems and
  software engineering — Systems and software Quality Requirements and
  Evaluation (SQuaRE) — System and software quality models* (ISO/IEC
  25010:2011).
- International Organization for Standardization. (2016). *Systems and
  software engineering — Systems and software Quality Requirements and
  Evaluation (SQuaRE) — Measurement of system and software product quality*
  (ISO/IEC 25023:2016).
- Microsoft. (2023). *Reliability*. Azure Well-Architected Framework.
  Microsoft Learn.
  https://learn.microsoft.com/en-us/azure/well-architected/reliability/
- Newman, S. (2021). *Building microservices: Designing fine-grained
  systems* (2nd ed.). O'Reilly Media.
- Nygard, M. T. (2018). *Release it!: Design and deploy production-ready
  software* (2nd ed.). Pragmatic Bookshelf.
- Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B., &
  Wesslén, A. (2012). *Experimentation in software engineering*. Springer.

---

## Anexos

### Anexo A. Script genérico de medición (Python)

El siguiente script ilustra, de forma genérica y adaptable a cualquier
sistema de gestión de restaurantes, cómo automatizar la medición de RFt-1-G
(evitación de fallos) y RFt-3-S (tiempo medio de notificación de fallo):
actúa como un cliente HTTP externo que envía estímulos anómalos típicos del
dominio (cantidades negativas en una comanda, fechas de reserva inválidas,
precios nulos) y registra el código de respuesta junto con la latencia de
cada caso. Cuando una petición no obtiene respuesta (timeout o
desconexión), el caso se registra como un fallo no evitado y su latencia se
penaliza con el valor del propio timeout, en lugar de excluirse del
promedio: así RFt-3-S no mejora artificialmente justo cuando ocurre el tipo
de falla más severo.

```python
import requests
import time

# Configuracion del entorno de evaluacion (generico, ajustar por sistema)
BASE_URL = "http://localhost:8080/api/v1"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer TEST_TOKEN",
}
TIMEOUT_S = 5.0  # limite de espera por peticion, evita bloqueos indefinidos

# Patrones de fallo tipicos del dominio de restaurantes (B = 3 casos)
test_cases = [
    {
        "name": "TC-01: Pedido con cantidad negativa",
        "endpoint": "/orders",
        "payload": {"tableId": 5, "items": [{"productId": 101, "quantity": -3}]},
    },
    {
        "name": "TC-02: Reserva con fecha invalida",
        "endpoint": "/reservations",
        "payload": {"tableId": 12, "dateTime": "fecha-invalida-2026"},
    },
    {
        "name": "TC-03: Item de menu con precio nulo",
        "endpoint": "/menu/items",
        "payload": {"name": "Plato de prueba", "price": None},
    },
]

failures_avoided = 0    # variable A de RFt-1-G
total_latency_ms = 0.0  # acumulador para RFt-3-S (todos los casos aportan)

for case in test_cases:
    b_i = time.perf_counter() * 1000  # Bi: instante de envio (ms)
    try:
        response = requests.post(
            f"{BASE_URL}{case['endpoint']}",
            json=case["payload"],
            headers=headers,
            timeout=TIMEOUT_S,
        )
        a_i = time.perf_counter() * 1000  # Ai: instante de respuesta (ms)
        latency = a_i - b_i

        # Criterio de exito: el sistema NO debe devolver un 5xx
        if response.status_code < 500:
            failures_avoided += 1
            print(f"[OK] {case['name']} -> {response.status_code} ({latency:.1f} ms)")
        else:
            print(f"[FALLO] {case['name']} -> {response.status_code} (error de servidor)")
    except requests.exceptions.RequestException as e:
        # Timeout o desconexion: NO evitado, se penaliza la latencia
        # con el propio timeout en vez de excluirla del promedio
        latency = TIMEOUT_S * 1000
        print(f"[CRITICO] {case['name']} -> sin respuesta (timeout/desconexion: {e})")

    total_latency_ms += latency

n = len(test_cases)
x_rft_1_g = failures_avoided / n
rft_3_s_promedio_ms = total_latency_ms / n

print(f"RFt-1-G = {failures_avoided}/{n} = {x_rft_1_g:.2f}")
print(f"RFt-3-S (promedio) = {rft_3_s_promedio_ms:.1f} ms (sobre {n} casos)")
```

El mismo patrón —enviar un estímulo, medir el estado de la respuesta y la
latencia, y acumular A y n— se reutiliza para CIn-1/2/3-G/S cambiando el
criterio de éxito por el que corresponda (formato válido, protocolo
soportado, código de estado esperado) y para RAv-1-G/RAv-2-G reemplazando
el envío de un estímulo por el sondeo periódico de un endpoint de salud.

### Anexo B. Estructura de la plantilla de consolidación (hoja de cálculo)

Los resultados de cada script se guardan en archivos CSV que luego se
consolidan en un libro de cálculo con una hoja por tipo de evidencia. Esta
estructura es independiente del sistema medido y puede reutilizarse en
cualquier evaluación de este tipo: una hoja "Resumen" con una fila por
medida (característica, ID, función de medición, A, B, X calculado con
fórmula viva, interpretación, fecha y entorno), y una hoja de detalle por
característica (interoperabilidad, disponibilidad, tolerancia a fallos) con
la evidencia caso por caso que sustenta cada conteo de A.

La siguiente tabla muestra un ejemplo ilustrativo de cómo luce una fila de
la hoja "Resumen" para cada una de las tres características evaluadas. Los
valores de X son ficticios, solo para fines demostrativos del formato.

| Característica | ID | X (ejemplo) | Interpretación |
|---|---|---|---|
| Interoperabilidad | CIn-1-G | 1.00 | 100 % de los formatos especificados son intercambiables. |
| Disponibilidad | RAv-1-G | 0.95 | El sistema estuvo disponible el 95 % de la ventana observada. |
| Tolerancia a fallos | RFt-1-G | 0.83 | 10 de 12 patrones de fallo fueron controlados sin error de servidor. |

> Elaboración propia. Valores de ejemplo; no corresponden a una medición
> real.

Trabajar con archivos CSV como fuente y una hoja de cálculo como capa de
presentación mantiene la evidencia cruda separada de su interpretación, y
facilita que cualquier persona del equipo audite un resultado sin depender
del script que lo generó.
