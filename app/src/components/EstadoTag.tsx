import { StyleSheet, Text, View } from "react-native";
import type { Estado } from "../types/modelo";
import { colores, espaciado, radio, tipografia } from "../theme/theme";

// Lenguaje del oficio, sin jerga informática.
const ETIQUETA: Record<Estado, string> = {
  nuevo: "Nuevo",
  respondido: "Esperando al cliente",
  agendado: "Agendado",
  descartado: "Descartado",
};

export function EstadoTag({ estado }: { estado: Estado }) {
  const colores_ = colores.estados[estado];
  return (
    <View style={[estilos.contenedor, { backgroundColor: colores_.fondo }]}>
      <Text style={[estilos.texto, { color: colores_.texto }]}>{ETIQUETA[estado]}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: radio,
    paddingHorizontal: espaciado.sm,
    paddingVertical: espaciado.xs,
    alignSelf: "flex-start",
  },
  texto: {
    fontSize: tipografia.chico,
    fontWeight: "700",
  },
});
