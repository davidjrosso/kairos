// Normaliza un teléfono a solo dígitos, para poder comparar números que llegan
// con formatos distintos (+54 9 11..., 011 15..., espacios, guiones, etc.).
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

// Compara los últimos N dígitos: alcanza para identificar el mismo número de
// celular aunque cambie el prefijo de país/área/el "15" o el "9" argentino.
const DIGITOS_SIGNIFICATIVOS = 8;

export function telefonosCoinciden(a: string, b: string): boolean {
  const na = normalizarTelefono(a);
  const nb = normalizarTelefono(b);
  if (na.length < DIGITOS_SIGNIFICATIVOS || nb.length < DIGITOS_SIGNIFICATIVOS) {
    return na === nb && na.length > 0;
  }
  return na.slice(-DIGITOS_SIGNIFICATIVOS) === nb.slice(-DIGITOS_SIGNIFICATIVOS);
}
