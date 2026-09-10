import { useEffect, useRef, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { CampoTexto } from "../components/CampoTexto";
import { BotonGrande } from "../components/BotonGrande";
import { crearPedido } from "../api/pedidos";
import { ErrorDeApi } from "../api/client";
import { borrarBorrador, guardarBorrador, leerBorrador } from "../lib/borrador";
import { colores, espaciado, tipografia } from "../theme/theme";

type Navegacion = NativeStackNavigationProp<RootStackParamList, "NuevoPedido">;

export function NuevoPedidoScreen() {
  const navigation = useNavigation<Navegacion>();
  const [textoOriginal, setTextoOriginal] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const borradorListo = useRef(false);

  useEffect(() => {
    (async () => {
      const borrador = await leerBorrador();
      if (borrador) {
        setTextoOriginal(borrador.textoOriginal);
        setTelefono(borrador.telefono);
        setMotivo(borrador.motivo);
      }
      borradorListo.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!borradorListo.current) return;
    guardarBorrador({ textoOriginal, telefono, motivo });
  }, [textoOriginal, telefono, motivo]);

  async function pegarDelPortapapeles() {
    const texto = await Clipboard.getStringAsync();
    if (texto) setTextoOriginal(texto);
  }

  async function guardar() {
    const hayDatos = textoOriginal.trim() || telefono.trim() || motivo.trim();
    if (!hayDatos) {
      setError("Pegá el mensaje del cliente o cargá al menos un dato.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const resultado = await crearPedido({
        textoOriginal: textoOriginal.trim() || undefined,
        telefono: telefono.trim() || undefined,
        motivo: motivo.trim() || undefined,
      });
      await borrarBorrador();
      navigation.replace("PedidoDetalle", { pedidoId: resultado.pedido.id });
    } catch (err) {
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <Text style={estilos.titulo}>Cargar pedido</Text>
        <Text style={estilos.ayuda}>
          Pegá el mensaje del cliente tal cual lo mandó, o completá los datos a mano si te lo pidieron por teléfono.
        </Text>

        <View style={estilos.botonPegar}>
          <BotonGrande titulo="Pegar mensaje del portapapeles" variante="secundario" onPress={pegarDelPortapapeles} />
        </View>

        <CampoTexto
          etiqueta="Mensaje del cliente"
          valor={textoOriginal}
          onCambiar={setTextoOriginal}
          placeholder="Pegá o escribí acá el mensaje…"
          multilinea
        />
        <CampoTexto
          etiqueta="Teléfono"
          valor={telefono}
          onCambiar={setTelefono}
          placeholder="Se completa solo si aparece en el mensaje"
          teclado="phone-pad"
        />
        <CampoTexto
          etiqueta="¿Qué necesita?"
          valor={motivo}
          onCambiar={setMotivo}
          placeholder="Ej: pérdida de agua en el baño"
        />

        {error && <Text style={estilos.error}>{error}</Text>}

        <BotonGrande titulo="Guardar pedido" onPress={guardar} cargando={guardando} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espaciado.md, gap: espaciado.md },
  titulo: { fontSize: tipografia.titulo, fontWeight: "800", color: colores.texto },
  ayuda: { fontSize: tipografia.base, color: colores.textoSecundario },
  botonPegar: { marginBottom: espaciado.xs },
  error: { fontSize: tipografia.base, color: colores.alerta },
});
