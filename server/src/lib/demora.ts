import type { Pedido } from "@prisma/client";

// Un pedido "nuevo" que pasa este umbral sin respuesta se marca como demorado.
export const UMBRAL_DEMORA_MS = 24 * 60 * 60 * 1000;

export function esDemorado(pedido: Pick<Pedido, "estado" | "createdAt">, ahora = Date.now()): boolean {
  if (pedido.estado !== "nuevo") return false;
  return ahora - pedido.createdAt.getTime() > UMBRAL_DEMORA_MS;
}
