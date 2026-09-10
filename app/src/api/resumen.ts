import { solicitar } from "./client";

export type Resumen = {
  desde: string;
  hasta: string;
  recibidos: number;
  agendados: number;
  descartados: number;
  pendientes: number;
  proporcionConvertida: number;
};

export function obtenerResumen(desde: string, hasta: string) {
  const parametros = new URLSearchParams({ desde, hasta });
  return solicitar<Resumen>(`/resumen?${parametros.toString()}`);
}
