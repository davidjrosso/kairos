import AsyncStorage from "@react-native-async-storage/async-storage";

// Guarda lo último que se pudo descargar para poder mostrarlo sin conexión.
// No implementa un tope de espacio ni liberación automática (queda para más
// adelante): el volumen de datos de un profesional independiente es chico.
const PREFIJO = "kairos:cache:";

export async function guardarCache<T>(clave: string, valor: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    // Si no se puede guardar la copia offline no rompemos la pantalla.
  }
}

export async function leerCache<T>(clave: string): Promise<T | null> {
  try {
    const crudo = await AsyncStorage.getItem(PREFIJO + clave);
    return crudo ? (JSON.parse(crudo) as T) : null;
  } catch {
    return null;
  }
}
