import { Router } from "express";
import { prisma } from "../lib/prisma";
import { normalizarTelefono, telefonosCoinciden } from "../lib/telefono";
import { ErrorParaUsuario } from "../lib/errores";

export const clientesRouter = Router();

// Busca un cliente existente por teléfono (compara los últimos dígitos para
// tolerar distintos formatos). No es un índice exacto: recorre los clientes
// porque el volumen esperado para un profesional independiente es chico.
async function buscarClientePorTelefono(telefono: string) {
  if (!telefono) return null;
  const clientes = await prisma.cliente.findMany({ where: { telefono: { not: null } } });
  return clientes.find((c) => c.telefono && telefonosCoinciden(c.telefono, telefono)) ?? null;
}

clientesRouter.get("/buscar", async (req, res, next) => {
  try {
    const telefono = String(req.query.telefono ?? "");
    if (!telefono) {
      throw new ErrorParaUsuario("Falta el teléfono para buscar el cliente.");
    }
    const cliente = await buscarClientePorTelefono(telefono);
    res.json({ cliente });
  } catch (err) {
    next(err);
  }
});

clientesRouter.post("/", async (req, res, next) => {
  try {
    const { nombre, telefono } = req.body as { nombre?: string; telefono?: string };
    if (!nombre || !nombre.trim()) {
      throw new ErrorParaUsuario("Poné un nombre para el cliente.");
    }
    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono ? normalizarTelefono(telefono) : null,
      },
    });
    res.status(201).json({ cliente });
  } catch (err) {
    next(err);
  }
});

clientesRouter.get("/:id", async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        domicilios: true,
        visitas: { orderBy: { fecha: "desc" }, include: { domicilio: true, pedidoOrigen: true } },
        pedidos: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!cliente) {
      throw new ErrorParaUsuario("No encontramos ese cliente.", 404);
    }
    res.json({ cliente });
  } catch (err) {
    next(err);
  }
});

export { buscarClientePorTelefono };
