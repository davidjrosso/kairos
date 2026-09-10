# architecture

How the system is put together — layers, boundaries, and how data flows.

## Monorepo /app + /server

- **What**: Kairos vive en un único repo con dos carpetas de primer nivel: `/app` (Expo, la app que usa el profesional) y `/server` (API Express que persiste todo en SQLite vía Prisma). No hay workspace/monorepo tool (Turborepo, Nx, etc.) — cada carpeta tiene su propio `package.json` y se instala/corre por separado.
- **Why**: Simplicidad para el arranque del proyecto; no había nada previo que forzara una herramienta de monorepo.
- **Where**: raíz del repo.
- **Learned**: —

## Modelo de datos de la bandeja de pedidos

- **What**: `Cliente` — `Domicilio` (1-a-muchos) — `Pedido` (clienteId y domicilioId opcionales, `textoOriginal` inmutable una vez creado) — `Visita` (clienteId y domicilioId obligatorios, `pedidoOrigenId` único que la vincula 1-a-1 con el pedido que la originó). `Pedido.estado` y `Pedido.motivoDescarte` son `String` (no enum de Prisma: SQLite no los soporta), validados a mano en las rutas contra listas fijas (`ESTADOS`, `MOTIVOS_DESCARTE` en `server/src/routes/pedidos.ts`).
- **Why**: Un pedido nace sin fecha ni domicilio confirmado; se agregan recién al convertirlo en visita. El vínculo pedido↔visita es 1 a 1 para poder "volver al pedido de origen" desde la visita (AC7).
- **Where**: `server/prisma/schema.prisma`.
- **Learned**: Coincidencia de cliente por teléfono no usa índice exacto: se normalizan los dígitos y se comparan los últimos 8 (`server/src/lib/telefono.ts`) porque el mismo número llega con +54, 9, 0, 15, espacios o guiones según cómo lo haya guardado el profesional o cómo aparezca en el mensaje. Funciona por `findMany` + filtro en memoria (no escala a miles de clientes, pero el volumen esperado de un profesional independiente es chico).

## Deshacer un descarte (Pedido)

- **What**: Al descartar un pedido se guarda su estado previo en `Pedido.estadoAnterior` y el timestamp en `descartadoEn`. `POST /pedidos/:id/deshacer-descarte` restaura `estadoAnterior` si pasaron menos de 8 segundos (`VENTANA_DESHACER_MS` en `server/src/routes/pedidos.ts`); si se pasó la ventana, devuelve un error amigable.
- **Why**: El requisito pide deshacer sin confirmación previa, con ventana de unos segundos. La ventana se valida también en el servidor (no solo ocultando el botón en el cliente) para que no se pueda deshacer un descarte viejo llamando al endpoint directamente.
- **Where**: `server/src/routes/pedidos.ts`.
- **Learned**: —

