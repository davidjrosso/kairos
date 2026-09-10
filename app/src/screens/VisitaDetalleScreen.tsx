import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { BotonGrande } from "../components/BotonGrande";
import { CampoTexto } from "../components/CampoTexto";
import { obtenerVisita } from "../api/visitas";
import { ErrorDeApi } from "../api/client";
import type { Visita } from "../types/modelo";
import { colores, espaciado, tipografia } from "../theme/theme";

type RutaVisita = RouteProp<RootStackParamList, "VisitaDetalle">;
type Navegacion = NativeStackNavigationProp<RootStackParamList, "VisitaDetalle">;

export function VisitaDetalleScreen() {
  const { params } = useRoute<RutaVisita>();
  const navigation = useNavigation<Navegacion>();
  const [visita, setVisita] = useState<Visita | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerVisita(params.visitaId);
      setVisita(datos.visita);
    } catch (err) {
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  }, [params.visitaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>Cargando la visita…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !visita) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.centro}>
          <Text style={estilos.textoError}>{error ?? "No encontramos esta visita."}</Text>
          <View style={estilos.espacioBoton}>
            <BotonGrande titulo="Reintentar" onPress={cargar} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo}>Visita agendada</Text>
        <Text style={estilos.textoPrincipal}>{new Date(visita.fecha).toLocaleString("es-AR")}</Text>

        <View style={estilos.bloque}>
          <Text style={estilos.subtitulo}>Cliente</Text>
          <Text style={estilos.textoPrincipal}>{visita.cliente?.nombre}</Text>
          <Text style={estilos.textoSecundario}>{visita.cliente?.telefono}</Text>
        </View>

        <View style={estilos.bloque}>
          <Text style={estilos.subtitulo}>Domicilio</Text>
          <Text style={estilos.textoPrincipal}>{visita.domicilio?.direccion}</Text>
        </View>

        <View style={estilos.bloque}>
          <Text style={estilos.subtitulo}>Motivo</Text>
          <Text style={estilos.textoPrincipal}>{visita.motivo}</Text>
        </View>

        {visita.pedidoOrigen && (
          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Pedido de origen</Text>
            <CampoTexto
              etiqueta="Mensaje original del cliente"
              valor={visita.pedidoOrigen.textoOriginal ?? "Este pedido se cargó a mano, sin mensaje pegado."}
              onCambiar={() => {}}
              soloLectura
              multilinea
            />
            <BotonGrande
              titulo="Ver pedido completo"
              variante="secundario"
              onPress={() => navigation.navigate("PedidoDetalle", { pedidoId: visita.pedidoOrigen!.id })}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espaciado.md, gap: espaciado.md },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: espaciado.lg },
  titulo: { fontSize: tipografia.titulo, fontWeight: "800", color: colores.texto },
  subtitulo: { fontSize: tipografia.subtitulo, fontWeight: "700", color: colores.texto },
  textoPrincipal: { fontSize: tipografia.base, color: colores.texto },
  textoSecundario: { fontSize: tipografia.base, color: colores.textoSecundario },
  textoError: { fontSize: tipografia.base, color: colores.alerta, textAlign: "center" },
  espacioBoton: { marginTop: espaciado.lg, alignSelf: "stretch" },
  bloque: { gap: espaciado.xs },
});
