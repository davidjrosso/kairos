import { solicitar } from "./client";
import type { Visita } from "../types/modelo";

export function obtenerVisita(id: string) {
  return solicitar<{ visita: Visita }>(`/visitas/${id}`);
}
