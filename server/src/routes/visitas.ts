import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ErrorParaUsuario } from "../lib/errores";
import { ocultarInternos } from "./pedidos";

export const visitasRouter = Router();

visitasRouter.get("/:id", async (req, res, next) => {
  try {
    const visita = await prisma.visita.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, domicilio: true, pedidoOrigen: true },
    });
    if (!visita) throw new ErrorParaUsuario("No encontramos esa visita.", 404);
    res.json({
      visita: { ...visita, pedidoOrigen: visita.pedidoOrigen ? ocultarInternos(visita.pedidoOrigen) : null },
    });
  } catch (err) {
    next(err);
  }
});
