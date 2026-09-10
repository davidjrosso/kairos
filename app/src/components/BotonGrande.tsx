import { Pressable, StyleSheet, Text, ActivityIndicator, TextStyle, ViewStyle } from "react-native";
import { colores, espaciado, radio, tipografia, toqueMinimo } from "../theme/theme";

type Variante = "primario" | "secundario" | "peligro";

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  cargando?: boolean;
};

export function BotonGrande({
  titulo,
  onPress,
  variante = "primario",
  deshabilitado = false,
  cargando = false,
}: Props) {
  const estilosVariante = ESTILOS_VARIANTE[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      disabled={deshabilitado || cargando}
      style={({ pressed }) => [
        estilos.boton,
        estilosVariante.boton,
        (deshabilitado || cargando) && estilos.deshabilitado,
        pressed && estilos.presionado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={estilosVariante.texto.color} />
      ) : (
        <Text style={[estilos.texto, estilosVariante.texto]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const ESTILOS_VARIANTE: Record<Variante, { boton: ViewStyle; texto: TextStyle }> = {
  primario: { boton: { backgroundColor: colores.primario }, texto: { color: colores.primarioTexto } },
  secundario: {
    boton: { backgroundColor: colores.fondo, borderWidth: 2, borderColor: colores.primario },
    texto: { color: colores.primario },
  },
  peligro: { boton: { backgroundColor: colores.alerta }, texto: { color: colores.primarioTexto } },
};

const estilos = StyleSheet.create({
  boton: {
    minHeight: toqueMinimo,
    borderRadius: radio,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.sm,
  },
  texto: {
    fontSize: tipografia.base,
    fontWeight: "700",
    textAlign: "center",
  },
  deshabilitado: { opacity: 0.5 },
  presionado: { opacity: 0.8 },
});
