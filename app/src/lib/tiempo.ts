export function formatearTiempoRelativo(iso: string, ahora: number = Date.now()): string {
  const diffMs = ahora - new Date(iso).getTime();
  const minutos = Math.floor(diffMs / 60000);

  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}
