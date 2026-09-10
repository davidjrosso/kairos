import { solicitar } from "./client";
import type { GrupoBandeja, MotivoDescarte, Pedido, Visita } from "../types/modelo";

export function obtenerBandeja() {
  return solicitar<{ grupos: GrupoBandeja[]; contadorPendientes: number; contadorDemorados: number }>(
    "/pedidos"
  );
}

export function obtenerPedido(id: string) {
  return solicitar<{ pedido: Pedido }>(`/pedidos/${id}`);
}

export function crearPedido(datos: { textoOriginal?: string; telefono?: string; motivo?: string }) {
  return solicitar<{
    pedido: Pedido;
    telefonoDetectadoAutomaticamente: boolean;
    clienteSugerido: { telefono: string } | null;
  }>("/pedidos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarPedido(
  id: string,
  cambios: { telefono?: string; motivo?: string; clienteId?: string | null }
) {
  return solicitar<{ pedido: Pedido }>(`/pedidos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });
}

export function responderPedido(id: string) {
  return solicitar<{ pedido: Pedido }>(`/pedidos/${id}/responder`, { method: "POST" });
}

export function descartarPedido(id: string, motivo: MotivoDescarte) {
  return solicitar<{ pedido: Pedido }>(`/pedidos/${id}/descartar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export function deshacerDescarte(id: string) {
  return solicitar<{ pedido: Pedido }>(`/pedidos/${id}/deshacer-descarte`, { method: "POST" });
}

export function convertirEnVisita(
  id: string,
  datos: { fecha: string; domicilioId?: string; direccionNueva?: string; motivo?: string }
) {
  return solicitar<{ visita: Visita; pedido: Pedido }>(`/pedidos/${id}/convertir-visita`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
