import { solicitar } from "./client";
import type { Cliente } from "../types/modelo";

export function crearCliente(datos: { nombre: string; telefono?: string }) {
  return solicitar<{ cliente: Cliente }>("/clientes", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
