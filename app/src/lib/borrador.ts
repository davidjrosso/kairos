import AsyncStorage from "@react-native-async-storage/async-storage";

// Sobrevive a que la aplicación se cierre sola por falta de memoria mientras
// se está cargando un pedido: se guarda en disco, no solo en memoria.
const CLAVE = "kairos:borrador-pedido";

export type BorradorPedido = {
  textoOriginal: string;
  telefono: string;
  motivo: string;
};

export async function leerBorrador(): Promise<BorradorPedido | null> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as BorradorPedido) : null;
  } catch {
    return null;
  }
}

export async function guardarBorrador(borrador: BorradorPedido): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(borrador));
  } catch {
    // Si no se puede guardar el borrador no rompemos la carga del pedido.
  }
}

export async function borrarBorrador(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLAVE);
  } catch {
    // no-op
  }
}
