-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Domicilio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Domicilio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "textoOriginal" TEXT,
    "telefonoDetectado" TEXT,
    "motivo" TEXT,
    "clienteId" TEXT,
    "domicilioId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "estadoAnterior" TEXT,
    "motivoDescarte" TEXT,
    "descartadoEn" DATETIME,
    "respondidoEn" DATETIME,
    "agendadoEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pedido_domicilioId_fkey" FOREIGN KEY ("domicilioId") REFERENCES "Domicilio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "domicilioId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "pedidoOrigenId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visita_domicilioId_fkey" FOREIGN KEY ("domicilioId") REFERENCES "Domicilio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visita_pedidoOrigenId_fkey" FOREIGN KEY ("pedidoOrigenId") REFERENCES "Pedido" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefono_key" ON "Cliente"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Visita_pedidoOrigenId_key" ON "Visita"("pedidoOrigenId");
