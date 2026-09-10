import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from "react-native";
import { colores, espaciado, radio, tipografia } from "../theme/theme";

type Props = {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  multilinea?: boolean;
  teclado?: KeyboardTypeOptions;
  soloLectura?: boolean;
};

export function CampoTexto({
  etiqueta,
  valor,
  onCambiar,
  placeholder,
  multilinea = false,
  teclado = "default",
  soloLectura = false,
}: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder={placeholder}
        placeholderTextColor={colores.textoSecundario}
        multiline={multilinea}
        keyboardType={teclado}
        editable={!soloLectura}
        style={[estilos.campo, multilinea && estilos.campoMultilinea, soloLectura && estilos.campoSoloLectura]}
        accessibilityLabel={etiqueta}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espaciado.xs },
  etiqueta: { fontSize: tipografia.base, fontWeight: "700", color: colores.texto },
  campo: {
    borderWidth: 2,
    borderColor: colores.borde,
    borderRadius: radio,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    fontSize: tipografia.base,
    color: colores.texto,
    minHeight: 56,
    backgroundColor: colores.fondo,
  },
  campoMultilinea: { minHeight: 120, textAlignVertical: "top" },
  campoSoloLectura: { backgroundColor: colores.tarjeta },
});
