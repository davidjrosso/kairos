import type { MotivoDescarte } from "../types/modelo";

export const MOTIVOS_DESCARTE: { clave: MotivoDescarte; etiqueta: string }[] = [
  { clave: "no_era_para_mi", etiqueta: "No era para mí" },
  { clave: "quedo_caro", etiqueta: "Quedó caro" },
  { clave: "no_contesto", etiqueta: "No contestó" },
  { clave: "lo_hizo_otro", etiqueta: "Lo hizo otro" },
];

export function etiquetaMotivoDescarte(motivo: MotivoDescarte | null): string {
  return MOTIVOS_DESCARTE.find((m) => m.clave === motivo)?.etiqueta ?? "Sin especificar";
}
