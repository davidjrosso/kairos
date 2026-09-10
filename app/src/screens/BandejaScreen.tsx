import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { obtenerBandeja } from "../api/pedidos";
import { ErrorDeApi, ErrorDeConexion } from "../api/client";
import { guardarCache, leerCache } from "../lib/cache";
import type { GrupoBandeja } from "../types/modelo";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { EstadoTag } from "../components/EstadoTag";
import { BotonGrande } from "../components/BotonGrande";
import { formatearTiempoRelativo } from "../lib/tiempo";
import { colores, espaciado, radio, tipografia } from "../theme/theme";

type Navegacion = NativeStackNavigationProp<RootStackParamList, "Bandeja">;

type DatosBandeja = { grupos: GrupoBandeja[]; contadorPendientes: number; contadorDemorados: number };

type EstadoPantalla =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | ({ tipo: "lista"; sinConexion: boolean } & DatosBandeja);

const CLAVE_CACHE = "bandeja";

export function BandejaScreen() {
  const navigation = useNavigation<Navegacion>();
  const [estado, setEstado] = useState<EstadoPantalla>({ tipo: "cargando" });
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setEstado({ tipo: "cargando" });
    try {
      const datos = await obtenerBandeja();
      await guardarCache(CLAVE_CACHE, datos);
      setEstado({ tipo: "lista", ...datos, sinConexion: false });
    } catch (err) {
      if (err instanceof ErrorDeConexion) {
        const cache = await leerCache<DatosBandeja>(CLAVE_CACHE);
        if (cache) {
          setEstado({ tipo: "lista", ...cache, sinConexion: true });
          return;
        }
      }
      const mensaje = err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.";
      setEstado({ tipo: "error", mensaje });
    } finally {
      if (esRefresh) setRefrescando(false);
    }
  }, []);

  // Vuelve a pedir la bandeja cada vez que la pantalla recupera el foco
  // (por ejemplo, al volver de cargar un pedido nuevo).
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Pedidos</Text>
        {estado.tipo === "lista" && (
          <View style={estilos.contador} accessibilityLabel={`${estado.contadorPendientes} pedidos pendientes`}>
            <Text style={estilos.contadorTexto}>{estado.contadorPendientes}</Text>
            <Text style={estilos.contadorEtiqueta}>
              {estado.contadorPendientes === 1 ? "pendiente" : "pendientes"}
            </Text>
          </View>
        )}
      </View>

      <View style={estilos.botonNuevo}>
        <BotonGrande titulo="Cargar pedido nuevo" onPress={() => navigation.navigate("NuevoPedido")} />
        <BotonGrande titulo="Ver resumen" variante="secundario" onPress={() => navigation.navigate("Resumen")} />
      </View>

      {estado.tipo === "lista" && estado.sinConexion && (
        <View style={estilos.avisoSinConexion}>
          <Text style={estilos.avisoSinConexionTexto}>
            Sin conexión — mostrando los últimos pedidos guardados en el equipo.
          </Text>
        </View>
      )}

      {estado.tipo === "cargando" && (
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>Cargando los pedidos…</Text>
        </View>
      )}

      {estado.tipo === "error" && (
        <View style={estilos.centro}>
          <Text style={estilos.textoError}>{estado.mensaje}</Text>
          <View style={estilos.espacioBoton}>
            <BotonGrande titulo="Reintentar" onPress={() => cargar()} />
          </View>
        </View>
      )}

      {estado.tipo === "lista" && estado.grupos.length === 0 && (
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>Todavía no hay pedidos cargados.</Text>
        </View>
      )}

      {estado.tipo === "lista" && estado.grupos.length > 0 && (
        <FlatList
          data={estado.grupos}
          keyExtractor={(grupo) => grupo.clienteId ?? grupo.pedidos[0].id}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={() => cargar(true)} />
          }
          renderItem={({ item }) => (
            <TarjetaGrupo
              grupo={item}
              onPress={() => navigation.navigate("PedidoDetalle", { pedidoId: item.pedidos[0].id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TarjetaGrupo({ grupo, onPress }: { grupo: GrupoBandeja; onPress: () => void }) {
  const pedidoReciente = grupo.pedidos[0];
  const nombre = grupo.clienteNombre ?? grupo.telefono ?? "Cliente sin datos";
  const previsualizacion =
    pedidoReciente.textoOriginal?.trim() || pedidoReciente.motivo?.trim() || "Pedido cargado a mano";
  const hayDemorados = grupo.pedidos.some((p) => p.demorado);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver pedido de ${nombre}${hayDemorados ? ", sin responder hace más de 24 horas" : ""}`}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaPresionada]}
    >
      {hayDemorados && (
        <View style={estilos.avisoDemorado}>
          <Text style={estilos.avisoDemoradoTexto}>Sin responder hace más de 24 h</Text>
        </View>
      )}
      <View style={estilos.tarjetaEncabezado}>
        <Text style={estilos.nombreCliente} numberOfLines={1}>
          {nombre}
        </Text>
        <View style={estilos.badge}>
          <Text style={estilos.badgeTexto}>
            {grupo.cantidadAbiertos} {grupo.cantidadAbiertos === 1 ? "pedido" : "pedidos"}
          </Text>
        </View>
      </View>

      {grupo.clienteNombre && grupo.telefono && (
        <Text style={estilos.telefono}>{grupo.telefono}</Text>
      )}

      <Text style={estilos.previsualizacion} numberOfLines={2} accessibilityLabel={previsualizacion}>
        {previsualizacion}
      </Text>

      <View style={estilos.tarjetaPie}>
        <EstadoTag estado={pedidoReciente.estado} />
        <Text style={estilos.tiempo}>{formatearTiempoRelativo(pedidoReciente.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.md,
    paddingBottom: espaciado.sm,
  },
  titulo: { fontSize: tipografia.titulo, fontWeight: "800", color: colores.texto },
  contador: {
    backgroundColor: colores.primario,
    borderRadius: radio,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    alignItems: "center",
    minWidth: 72,
  },
  contadorTexto: { color: colores.primarioTexto, fontSize: tipografia.subtitulo, fontWeight: "800" },
  contadorEtiqueta: { color: colores.primarioTexto, fontSize: tipografia.chico },
  botonNuevo: { paddingHorizontal: espaciado.md, paddingBottom: espaciado.sm, gap: espaciado.sm },
  avisoSinConexion: {
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
    backgroundColor: colores.alertaFondo,
    borderRadius: radio,
    padding: espaciado.sm,
  },
  avisoSinConexionTexto: { color: colores.alerta, fontSize: tipografia.chico, fontWeight: "700" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: espaciado.lg },
  textoSecundario: { fontSize: tipografia.base, color: colores.textoSecundario, textAlign: "center" },
  textoError: { fontSize: tipografia.base, color: colores.alerta, textAlign: "center" },
  espacioBoton: { marginTop: espaciado.lg, alignSelf: "stretch" },
  lista: { padding: espaciado.md, gap: espaciado.md },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio,
    padding: espaciado.md,
    borderWidth: 1,
    borderColor: colores.borde,
    gap: espaciado.xs,
  },
  tarjetaPresionada: { opacity: 0.8 },
  avisoDemorado: {
    backgroundColor: colores.alertaFondo,
    borderRadius: radio,
    paddingHorizontal: espaciado.sm,
    paddingVertical: espaciado.xs,
    alignSelf: "flex-start",
  },
  avisoDemoradoTexto: { color: colores.alerta, fontSize: tipografia.chico, fontWeight: "700" },
  tarjetaEncabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: espaciado.sm },
  nombreCliente: { fontSize: tipografia.subtitulo, fontWeight: "700", color: colores.texto, flexShrink: 1 },
  badge: {
    backgroundColor: colores.fondo,
    borderRadius: radio,
    paddingHorizontal: espaciado.sm,
    paddingVertical: espaciado.xs,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  badgeTexto: { fontSize: tipografia.chico, fontWeight: "700", color: colores.textoSecundario },
  telefono: { fontSize: tipografia.chico, color: colores.textoSecundario },
  previsualizacion: { fontSize: tipografia.base, color: colores.texto },
  tarjetaPie: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: espaciado.xs },
  tiempo: { fontSize: tipografia.chico, color: colores.textoSecundario },
});
