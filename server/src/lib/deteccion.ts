// Detección automática de teléfono en el texto pegado del cliente.
// Nunca debe romper ni tardar: es una heurística con regex, no un servicio
// externo. Si no encuentra nada, el pedido se crea igual (ver server/src/routes/pedidos.ts).

const CANDIDATO = /\+?\d[\d\s().-]{6,}\d/g;
const PARECE_FECHA = /^\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4}$/;

const DIGITOS_MIN = 8;
const DIGITOS_MAX = 13;

export type TelefonoDetectado = {
  telefono: string; // solo dígitos, normalizado
  textoDetectado: string; // el fragmento tal cual apareció en el mensaje
};

export function detectarTelefono(texto: string): TelefonoDetectado | null {
  try {
    const candidatos: TelefonoDetectado[] = [];
    for (const match of texto.matchAll(CANDIDATO)) {
      const fragmento = match[0].trim();
      if (PARECE_FECHA.test(fragmento)) continue;
      const digitos = fragmento.replace(/\D/g, "");
      if (digitos.length < DIGITOS_MIN || digitos.length > DIGITOS_MAX) continue;
      candidatos.push({ telefono: digitos, textoDetectado: fragmento });
    }
    if (candidatos.length === 0) return null;
    // Se prefiere el candidato con más dígitos (más probable que incluya
    // código de área/país, menos probable que sea un falso positivo corto).
    candidatos.sort((a, b) => b.telefono.length - a.telefono.length);
    return candidatos[0];
  } catch {
    // La detección jamás debe frenar el alta del pedido.
    return null;
  }
}
