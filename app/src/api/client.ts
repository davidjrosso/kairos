import Constants from "expo-constants";

const API_URL = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? "http://10.0.2.2:3001";

// Mensaje en lenguaje común: nunca mostramos el motivo técnico del fallo de red.
const SIN_CONEXION = "No hay conexión. Probá de nuevo cuando tengas señal.";
const ERROR_INESPERADO = "Algo falló. Probá de nuevo en un momento.";

export class ErrorDeApi extends Error {}

// Se distingue de ErrorDeApi para que las pantallas puedan ofrecer la
// bandeja/el pedido ya descargados en vez de una pantalla de error a secas.
export class ErrorDeConexion extends ErrorDeApi {}

export async function solicitar<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...(opciones.headers ?? {}) },
    });
  } catch {
    throw new ErrorDeConexion(SIN_CONEXION);
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorDeApi(
      typeof datos?.error === "string" ? datos.error : ERROR_INESPERADO
    );
  }

  return datos as T;
}
