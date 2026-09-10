# decision

A choice made and the reasoning behind it — the path taken over the alternatives.

## Stack de la app: Expo (React Native + TypeScript)

- **What**: La app de Kairos se construye con Expo (React Native + TypeScript), en `/app`. Se descartaron Flutter y Android nativo (Kotlin) para esta etapa.
- **Why**: El usuario eligió Expo por velocidad de desarrollo multiplataforma. Los requisitos de "Bandeja de pedidos entrantes" exigen un dispositivo Android de gama baja (2GB RAM, Android 8), poco peso de instalación y compartir texto desde WhatsApp — Expo lo cubre con un dev client / config plugins, a costa de un bundle algo más pesado que nativo puro.
- **Where**: `/app` (Expo + TypeScript, template blank-typescript).
- **Learned**: Node instalado es v20.11.0, por debajo del mínimo que pide Expo 57 (`>=20.19.4`). El bundling con Metro funciona igual (advertencia, no error) pero conviene actualizar Node antes de compilar con EAS o para evitar problemas más adelante. Ver [[gotchas]].

## Backend mínimo: Express + TypeScript + Prisma + SQLite

- **What**: Se construye un backend propio desde cero en `/server` (Express + TypeScript + Prisma + SQLite), en vez de dejar la bandeja con datos simulados o depender de un backend externo.
- **Why**: No existía ningún backend en el repo y la bandeja necesita persistencia real (pedidos, clientes, domicilios, visitas) desde el día uno. SQLite se eligió para no requerir infraestructura externa durante el MVP; se puede migrar a Postgres más adelante sin cambiar el modelo (Prisma abstrae el motor).
- **Where**: `/server` (Express 5, Prisma 6, SQLite via `DATABASE_URL=file:./dev.db`).
- **Learned**: —

## Alcance de "Bandeja de pedidos entrantes": MVP recortado

- **What**: De los 22 criterios de aceptación del work order, se decidió construir un primer corte (MVP) y dejar explícitamente afuera: compartir directo desde WhatsApp (share intent — por ahora solo pegar texto), convertir un pedido en presupuesto (el módulo de presupuestos no existe todavía), la política de tope de almacenamiento offline con liberación automática de lo más viejo, el aviso push real a las 24hs (queda como indicador visual) y la medición formal en dispositivo real / prueba con usuarios reales.
- **Why**: El alcance completo es muy grande para una sola entrega y varias de esas piezas dependen de infraestructura que no existe aún (módulo de presupuestos) o de validación que solo se puede hacer con dispositivos/usuarios reales, fuera del alcance de una sesión de desarrollo.
- **Where**: Aplica a todo `/app` y `/server` de la bandeja de pedidos.
- **Learned**: —

## Detección de teléfono: heurística regex en el servidor, no un servicio externo

- **What**: `detectarTelefono` (`server/src/lib/deteccion.ts`) busca en el texto pegado corridas de dígitos con separadores (espacio, guion, punto, paréntesis) de 8 a 13 dígitos normalizados, descarta las que tienen forma de fecha (`DD-MM-YYYY` con esos mismos separadores) y, si hay varios candidatos, se queda con el que tiene más dígitos. Corre en `POST /pedidos` del servidor, no en el cliente.
- **Why**: Cumple el requisito de que la detección nunca bloquee el alta (es síncrona, instantánea, envuelta en try/catch que devuelve `null` ante cualquier error) sin depender de un servicio externo ni de conexión. Se prefirió correrla en el servidor para tener una sola fuente de verdad y poder testearla con `node:test` sin levantar la app.
- **Where**: `server/src/lib/deteccion.ts`, enganchada en `server/src/routes/pedidos.ts` (`POST /`).
- **Learned**: Es una heurística deliberadamente imperfecta (puede confundir un número de casa largo con teléfono, o no detectar formatos raros) — está bien porque el pedido se crea igual y el campo queda editable. No intentar afinarla más sin un caso real que lo justifique.

## Alta de pedido: una sola pantalla para "pegar" y "a mano", confirmación en la pantalla de detalle

- **What**: `NuevoPedidoScreen` es un único formulario (mensaje pegado + teléfono + motivo, todos opcionales salvo que al menos uno tenga datos) que sirve tanto para pegar el mensaje de WhatsApp como para la carga manual sin texto — no hay dos pantallas separadas. Al guardar, navega con `replace` (no `push`) a `PedidoDetalleScreen`, que muestra el teléfono detectado ya precargado y editable, y si no hay cliente asociado ofrece darlo de alta ahí mismo.
- **Why**: El requisito pide que ambas vías de alta "se comporten igual en todos los estados posteriores" (AC5) — comparten pantalla y mismo endpoint `POST /pedidos`. Se usa `replace` en vez de `push` para que "Atrás" desde el detalle vuelva a la bandeja y no al formulario ya guardado (evita reenvíos accidentales).
- **Where**: `app/src/screens/NuevoPedidoScreen.tsx`, `app/src/screens/PedidoDetalleScreen.tsx`.
- **Learned**: El botón "Pegar mensaje del portapapeles" (`expo-clipboard`) es un agregado de conveniencia para el perfil de usuario del work order (poca experiencia técnica) — el campo de texto también acepta pegar con el gesto nativo del teléfono, no depende exclusivamente del botón.

## Borrador de pedido en AsyncStorage, no en memoria

- **What**: `app/src/lib/borrador.ts` guarda en `AsyncStorage` (clave `kairos:borrador-pedido`) el texto pegado/tipeado de `NuevoPedidoScreen` en cada cambio, y lo borra recién cuando el pedido se crea con éxito. Al montar la pantalla, si hay un borrador guardado se precarga antes de habilitar el autoguardado (con un `ref` para no pisarlo con los valores iniciales vacíos del estado).
- **Why**: Requisito: si la app se cierra sola por falta de memoria mientras se carga un pedido, al reabrirla el texto tiene que seguir ahí. `AsyncStorage` persiste en disco; el estado de React no sobrevive un cierre del proceso.
- **Where**: `app/src/lib/borrador.ts`, usado en `app/src/screens/NuevoPedidoScreen.tsx`.
- **Learned**: —

## Responder = abrir WhatsApp + marcar estado en un solo botón

- **What**: "Responder por WhatsApp" (`PedidoDetalleScreen.responderPorWhatsApp`) hace `Linking.openURL('https://wa.me/<telefono>')` y, si el pedido estaba en estado `nuevo`, además llama a `POST /pedidos/:id/responder`. Si ya estaba `respondido` o `agendado`, solo reabre el chat sin volver a llamar a la API.
- **Why**: El requisito pide "acceso en un toque" para responder por WhatsApp con el chat ya abierto — una sola acción cubre both abrir el chat y registrar que el profesional ya contestó, sin pasos de más.
- **Where**: `app/src/screens/PedidoDetalleScreen.tsx`.
- **Learned**: —

## Descartar: motivos como botones visibles, deshacer con ventana de 8s reflejada en el cliente

- **What**: Al tocar "Descartar pedido" se revelan 4 botones (uno por motivo) en el mismo lugar — no hay un picker/dropdown ni un diálogo de confirmación. Elegir un motivo descarta inmediatamente y arranca un `setTimeout` de 8000ms (mismo valor que `VENTANA_DESHACER_MS` del servidor) que oculta el botón "Deshacer" al expirar.
- **Why**: Cumple "toda acción con botón visible" y "deshacer en vez de confirmar antes". El timeout del cliente es solo de UI (oculta el botón); el servidor vuelve a validar la ventana de forma independiente (ver [[architectures]] → "Deshacer un descarte").
- **Where**: `app/src/screens/PedidoDetalleScreen.tsx`.
- **Learned**: Si el usuario navega fuera de la pantalla del pedido antes de que expire la ventana, pierde la posibilidad de deshacer desde ahí (no hay temporizador global ni banner en la bandeja) — aceptable para el MVP, pero si en el futuro se pide poder deshacer desde la bandeja misma, hay que mover este estado a un nivel más alto (context/store), no a la pantalla de detalle.

## Convertir a visita: domicilio existente o nuevo, fecha con selector nativo en dos pasos

- **What**: Si el cliente ya tiene domicilios cargados (`cliente.domicilios`, incluidos en `GET /pedidos/:id`), se listan como opciones tocables; si no tiene ninguno (o el profesional elige "Cargar otra dirección"), se muestra un campo de texto libre. La fecha se elige con `@react-native-community/datetimepicker` en dos pasos (primero `mode="date"`, después `mode="time"`) porque el modo combinado `datetime` no es confiable en todas las versiones de Android.
- **Why**: "Sin retipear nada" — si el domicilio ya existe no hay que volver a escribirlo. El picker nativo evita que un usuario con poca experiencia técnica tenga que tipear una fecha a mano.
- **Where**: `app/src/screens/PedidoDetalleScreen.tsx`; endpoint `POST /pedidos/:id/convertir-visita` en `server/src/routes/pedidos.ts`.
- **Learned**: —

## Pantalla mínima de Visita (no el módulo de agenda completo)

- **What**: `VisitaDetalleScreen` es una vista de solo lectura de una visita (fecha, cliente, domicilio, motivo, y el pedido de origen con su texto original + link para verlo completo). No hay calendario ni listado de visitas — ese es el módulo de agenda "del núcleo" que el work order da por existente/futuro, fuera del alcance de la bandeja.
- **Why**: AC6/AC7 piden poder "abrir la visita" y volver al pedido de origen desde ahí; se construyó lo mínimo para cumplir eso sin invadir el alcance de un módulo de agenda que no fue pedido en este work order.
- **Where**: `app/src/screens/VisitaDetalleScreen.tsx`; `GET /visitas/:id` en `server/src/routes/visitas.ts`.
- **Learned**: El "historial del domicilio" (para volver al pedido de origen desde ahí, mencionado en el requisito 16) quedó sin implementar — no existe ninguna pantalla de domicilio en este MVP. Es una omisión consciente, no cubierta por los cortes de alcance ya acordados; anotarlo si se retoma este trabajo.

## "Demorado" se calcula al vuelo, no se guarda en la base

- **What**: `esDemorado` (`server/src/lib/demora.ts`) es una función pura: `estado === 'nuevo' && ahora - createdAt > 24h`. Se evalúa en cada respuesta (`ocultarInternos` en `server/src/routes/pedidos.ts` le agrega el campo `demorado` a todo pedido serializado) — no hay un job/cron que actualice un campo en la base ni una notificación push real.
- **Why**: Con el volumen esperado (un profesional independiente, no miles de pedidos) recalcularlo en cada request es más simple y no puede desincronizarse. El "aviso" real (push/notificación) quedó fuera del MVP (ver el recorte de alcance ya registrado); por ahora es solo la marca visual "Sin responder hace más de 24 h" en la tarjeta de la bandeja.
- **Where**: `server/src/lib/demora.ts`, usado en `server/src/routes/pedidos.ts` y mostrado en `app/src/screens/BandejaScreen.tsx`.
- **Learned**: —

## Resumen del período: se filtra por fecha de recepción (createdAt), no por fecha del cambio de estado

- **What**: `GET /resumen?desde=&hasta=` (`server/src/routes/resumen.ts`) cuenta los pedidos cuyo `createdAt` cae en el rango, y los clasifica por su `estado` actual (agendado/descartado/el resto pendiente). No mira `agendadoEn`/`descartadoEn` para decidir si entran en el período.
- **Why**: Es la única forma de garantizar el invariante pedido por el work order (AC12): `agendados + descartados + pendientes === recibidos`, siempre, para cualquier período. Si se contara por fecha del cambio de estado, un pedido podría "recibirse" en un período y "agendarse" en otro, rompiendo la suma.
- **Where**: `server/src/routes/resumen.ts`; `app/src/screens/ResumenScreen.tsx` (períodos: últimos 7 días, últimos 30 días, todo — ventanas móviles, no mes/semana calendario, para evitar líos de huso horario).
- **Learned**: —

## Sin conexión: se detecta por el fallo de fetch, no con una librería de red aparte

- **What**: `ErrorDeConexion` (subclase de `ErrorDeApi` en `app/src/api/client.ts`) se lanza únicamente cuando el `fetch` en sí falla (sin red). Las pantallas que necesitan distinguir "sin conexión" de "error del servidor" comparan `err instanceof ErrorDeConexion`, no agregan `@react-native-community/netinfo` ni ninguna detección proactiva de conectividad.
- **Why**: Evita una dependencia más (la app tiene que pesar poco) y es igual de confiable: si el fetch no tira `ErrorDeConexion`, hay conexión al servidor, que es lo único que importa acá. Detectar "sin wifi" de antemano no aporta nada que no dé ya el resultado real del intento de red.
- **Where**: `app/src/api/client.ts`, usado en `app/src/screens/BandejaScreen.tsx` y `app/src/screens/PedidoDetalleScreen.tsx`.
- **Learned**: —

## Caché offline: última copia por pantalla, sin tope de espacio (deferred)

- **What**: `app/src/lib/cache.ts` (`guardarCache`/`leerCache`, prefijo `kairos:cache:` en AsyncStorage) guarda la última respuesta exitosa de la bandeja (`kairos:cache:bandeja`) y de cada pedido visto (`kairos:cache:pedido:<id>`). Si una carga falla por `ErrorDeConexion`, la pantalla usa la copia cacheada y muestra un aviso "Sin conexión" en vez de la pantalla de error; los botones que escriben (guardar datos, responder, descartar, agendar, dar de alta cliente) quedan deshabilitados mientras se está mostrando la copia offline.
- **Why**: Cumple "consulta sin conexión de la bandeja y de los pedidos ya descargados" y "crear/responder/convertir requiere conexión, con aviso claro". No implementa el tope de almacenamiento con liberación automática de lo más viejo — eso quedó explícitamente fuera del MVP (ver el recorte de alcance ya registrado); hoy la caché crece sin límite (aceptable para el volumen de un profesional independiente, pero hay que resolverlo si se retoma ese ítem).
- **Where**: `app/src/lib/cache.ts`, usado en `app/src/screens/BandejaScreen.tsx` y `app/src/screens/PedidoDetalleScreen.tsx`.
- **Learned**: `NuevoPedidoScreen` no necesitó cambios para "sin perder lo pegado al fallar por conexión": como el borrador ya se autoguarda en cada cambio (ver [[decisions]] → "Borrador de pedido en AsyncStorage") y solo se borra tras un alta exitosa, un fallo de red simplemente deja el formulario y el borrador intactos.

