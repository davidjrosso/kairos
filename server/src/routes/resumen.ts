import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ErrorParaUsuario } from "../lib/errores";

export const resumenRouter = Router();

resumenRouter.get("/", async (req, res, next) => {
  try {
    const desdeParam = req.query.desde ? new Date(String(req.query.desde)) : new Date(0);
    const hastaParam = req.query.hasta ? new Date(String(req.query.hasta)) : new Date();

    if (Number.isNaN(desdeParam.getTime()) || Number.isNaN(hastaParam.getTime())) {
      throw new ErrorParaUsuario("El período elegido no es válido.");
    }

    const pedidos = await prisma.pedido.findMany({
      where: { createdAt: { gte: desdeParam, lte: hastaParam } },
      select: { estado: true },
    });

    const recibidos = pedidos.length;
    const agendados = pedidos.filter((p) => p.estado === "agendado").length;
    const descartados = pedidos.filter((p) => p.estado === "descartado").length;
    const pendientes = recibidos - agendados - descartados;
    const proporcionConvertida = recibidos > 0 ? agendados / recibidos : 0;

    res.json({
      desde: desdeParam.toISOString(),
      hasta: hastaParam.toISOString(),
      recibidos,
      agendados,
      descartados,
      pendientes,
      proporcionConvertida,
    });
  } catch (err) {
    next(err);
  }
});
