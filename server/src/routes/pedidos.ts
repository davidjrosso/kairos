import { Router } from "express";
import { prisma } from "../lib/prisma";
import { normalizarTelefono } from "../lib/telefono";
import { detectarTelefono } from "../lib/deteccion";
import { esDemorado } from "../lib/demora";
import { ErrorParaUsuario } from "../lib/errores";
import { buscarClientePorTelefono } from "./clientes";
import type { Pedido } from "@prisma/client";

export const pedidosRouter = Router();

const ESTADOS = ["nuevo", "respondido", "agendado", "descartado"] as const;
type Estado = (typeof ESTADOS)[number];

export const MOTIVOS_DESCARTE = {
  no_era_para_mi: "No era para mí",
  quedo_caro: "Quedó caro",
  no_contesto: "No contestó",
  lo_hizo_otro: "Lo hizo otro",
} as const;
type MotivoDescarte = keyof typeof MOTIVOS_DESCARTE;

// Ventana durante la cual "descartar" se puede deshacer desde la bandeja.
const VENTANA_DESHACER_MS = 8000;

export function ocultarInternos(pedido: Pedido) {
  const { estadoAnterior: _estadoAnterior, ...resto } = pedido;
  return { ...resto, demorado: esDemorado(pedido) };
}

pedidosRouter.get("/", async (_req, res, next) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: "desc" },
      include: { cliente: true, domicilio: true },
    });

    type Grupo = {
      clienteId: string | null;
      clienteNombre: string | null;
      telefono: string | null;
      pedidos: ReturnType<typeof ocultarInternos>[];
      cantidadAbiertos: number;
      ultimoPedidoEn: Date;
    };

    const grupos = new Map<string, Grupo>();
    for (const pedido of pedidos) {
      const clave = pedido.clienteId ?? `pedido:${pedido.id}`;
      let grupo = grupos.get(clave);
      if (!grupo) {
        grupo = {
          clienteId: pedido.clienteId,
          clienteNombre: pedido.cliente?.nombre ?? null,
          telefono: pedido.cliente?.telefono ?? pedido.telefonoDetectado ?? null,
          pedidos: [],
          cantidadAbiertos: 0,
          ultimoPedidoEn: pedido.createdAt,
        };
        grupos.set(clave, grupo);
      }
      grupo.pedidos.push(ocultarInternos(pedido));
      if (pedido.estado === "nuevo" || pedido.estado === "respondido") {
        grupo.cantidadAbiertos += 1;
      }
      if (pedido.createdAt > grupo.ultimoPedidoEn) {
        grupo.ultimoPedidoEn = pedido.createdAt;
      }
    }

    const listaGrupos = Array.from(grupos.values()).sort(
      (a, b) => b.ultimoPedidoEn.getTime() - a.ultimoPedidoEn.getTime()
    );

    const contadorPendientes = pedidos.filter(
      (p) => p.estado === "nuevo" || p.estado === "respondido"
    ).length;
    const contadorDemorados = pedidos.filter((p) => esDemorado(p)).length;

    res.json({ grupos: listaGrupos, contadorPendientes, contadorDemorados });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body as {
      textoOriginal?: string;
      telefono?: string;
      clienteId?: string;
      motivo?: string;
    };

    const textoOriginal = body.textoOriginal?.trim() || null;
    const motivo = body.motivo?.trim() || null;
    let telefonoIngresado = body.telefono?.trim() || null;

    if (!textoOriginal && !telefonoIngresado && !motivo) {
      throw new ErrorParaUsuario(
        "Pegá el mensaje del cliente o cargá al menos un dato para crear el pedido."
      );
    }

    // La detección nunca debe frenar el alta: si tarda o falla, el pedido se
    // crea igual con el texto guardado y el teléfono queda para completar a mano.
    let detectado = false;
    if (!telefonoIngresado && textoOriginal) {
      const encontrado = detectarTelefono(textoOriginal);
      if (encontrado) {
        telefonoIngresado = encontrado.telefono;
        detectado = true;
      }
    }

    let clienteId = body.clienteId ?? null;
    let clienteEncontrado = null;
    if (!clienteId && telefonoIngresado) {
      clienteEncontrado = await buscarClientePorTelefono(telefonoIngresado);
      if (clienteEncontrado) clienteId = clienteEncontrado.id;
    }

    const pedido = await prisma.pedido.create({
      data: {
        textoOriginal,
        telefonoDetectado: telefonoIngresado ? normalizarTelefono(telefonoIngresado) : null,
        motivo,
        clienteId,
        estado: "nuevo",
      },
      include: { cliente: true, domicilio: true },
    });

    res.status(201).json({
      pedido: ocultarInternos(pedido),
      telefonoDetectadoAutomaticamente: detectado,
      clienteSugerido: !clienteId && telefonoIngresado ? { telefono: telefonoIngresado } : null,
    });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.get("/:id", async (req, res, next) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: { include: { visitas: { orderBy: { fecha: "desc" } }, domicilios: true } },
        domicilio: true,
        visita: true,
      },
    });
    if (!pedido) throw new ErrorParaUsuario("No encontramos ese pedido.", 404);
    res.json({ pedido: ocultarInternos(pedido) });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.patch("/:id", async (req, res, next) => {
  try {
    const body = req.body as {
      telefono?: string;
      motivo?: string;
      clienteId?: string | null;
      domicilioId?: string | null;
    };
    const existente = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!existente) throw new ErrorParaUsuario("No encontramos ese pedido.", 404);

    const pedido = await prisma.pedido.update({
      where: { id: req.params.id },
      data: {
        telefonoDetectado:
          body.telefono !== undefined ? normalizarTelefono(body.telefono) || null : undefined,
        motivo: body.motivo !== undefined ? body.motivo : undefined,
        clienteId: body.clienteId !== undefined ? body.clienteId : undefined,
        domicilioId: body.domicilioId !== undefined ? body.domicilioId : undefined,
      },
      include: { cliente: true, domicilio: true },
    });
    res.json({ pedido: ocultarInternos(pedido) });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.post("/:id/responder", async (req, res, next) => {
  try {
    const existente = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!existente) throw new ErrorParaUsuario("No encontramos ese pedido.", 404);
    if (existente.estado === "descartado") {
      throw new ErrorParaUsuario("Este pedido está descartado, no se puede responder.");
    }
    const pedido = await prisma.pedido.update({
      where: { id: req.params.id },
      data: { estado: "respondido" satisfies Estado, respondidoEn: new Date() },
    });
    res.json({ pedido: ocultarInternos(pedido) });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.post("/:id/descartar", async (req, res, next) => {
  try {
    const { motivo } = req.body as { motivo?: MotivoDescarte };
    if (!motivo || !(motivo in MOTIVOS_DESCARTE)) {
      throw new ErrorParaUsuario("Elegí por qué se descarta el pedido.");
    }
    const existente = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!existente) throw new ErrorParaUsuario("No encontramos ese pedido.", 404);
    if (existente.estado === "agendado") {
      throw new ErrorParaUsuario("Este pedido ya está agendado, no se puede descartar.");
    }
    const pedido = await prisma.pedido.update({
      where: { id: req.params.id },
      data: {
        estadoAnterior: existente.estado,
        estado: "descartado" satisfies Estado,
        motivoDescarte: motivo,
        descartadoEn: new Date(),
      },
    });
    res.json({ pedido: ocultarInternos(pedido) });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.post("/:id/deshacer-descarte", async (req, res, next) => {
  try {
    const existente = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!existente) throw new ErrorParaUsuario("No encontramos ese pedido.", 404);
    if (existente.estado !== "descartado" || !existente.descartadoEn) {
      throw new ErrorParaUsuario("Este pedido no está descartado.");
    }
    const pasaron = Date.now() - existente.descartadoEn.getTime();
    if (pasaron > VENTANA_DESHACER_MS) {
      throw new ErrorParaUsuario("Ya pasó el tiempo para deshacer este descarte.");
    }
    const pedido = await prisma.pedido.update({
      where: { id: req.params.id },
      data: {
        estado: existente.estadoAnterior ?? "nuevo",
        estadoAnterior: null,
        motivoDescarte: null,
        descartadoEn: null,
      },
    });
    res.json({ pedido: ocultarInternos(pedido) });
  } catch (err) {
    next(err);
  }
});

pedidosRouter.post("/:id/convertir-visita", async (req, res, next) => {
  try {
    const body = req.body as {
      fecha?: string;
      domicilioId?: string;
      direccionNueva?: string;
      motivo?: string;
    };

    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, domicilio: true },
    });
    if (!pedido) throw new ErrorParaUsuario("No encontramos ese pedido.", 404);
    if (pedido.estado === "agendado") {
      throw new ErrorParaUsuario("Este pedido ya tiene una visita agendada.");
    }
    if (pedido.estado === "descartado") {
      throw new ErrorParaUsuario("Este pedido está descartado, no se puede agendar.");
    }
    if (!pedido.clienteId) {
      throw new ErrorParaUsuario("Este pedido necesita un cliente asociado antes de agendarlo.");
    }
    if (!body.fecha) {
      throw new ErrorParaUsuario("Elegí una fecha para la visita.");
    }
    const fecha = new Date(body.fecha);
    if (Number.isNaN(fecha.getTime())) {
      throw new ErrorParaUsuario("La fecha de la visita no es válida.");
    }

    const motivoFinal = (body.motivo ?? pedido.motivo ?? "").trim();
    if (!motivoFinal) {
      throw new ErrorParaUsuario("Contame brevemente el motivo del trabajo antes de agendar.");
    }

    let domicilioId = body.domicilioId ?? pedido.domicilioId ?? null;
    if (!domicilioId && body.direccionNueva?.trim()) {
      const domicilioNuevo = await prisma.domicilio.create({
        data: { clienteId: pedido.clienteId, direccion: body.direccionNueva.trim() },
      });
      domicilioId = domicilioNuevo.id;
    }
    if (!domicilioId) {
      throw new ErrorParaUsuario("Falta la dirección para agendar la visita.");
    }

    const [visita, pedidoActualizado] = await prisma.$transaction([
      prisma.visita.create({
        data: {
          clienteId: pedido.clienteId,
          domicilioId,
          motivo: motivoFinal,
          fecha,
          pedidoOrigenId: pedido.id,
        },
      }),
      prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          estado: "agendado" satisfies Estado,
          agendadoEn: new Date(),
          domicilioId,
          motivo: motivoFinal,
        },
      }),
    ]);

    res.status(201).json({ visita, pedido: ocultarInternos(pedidoActualizado) });
  } catch (err) {
    next(err);
  }
});
