import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { CampoTexto } from "../components/CampoTexto";
import { BotonGrande } from "../components/BotonGrande";
import { EstadoTag } from "../components/EstadoTag";
import {
  actualizarPedido,
  convertirEnVisita,
  deshacerDescarte,
  descartarPedido,
  obtenerPedido,
  responderPedido,
} from "../api/pedidos";
import { crearCliente } from "../api/clientes";
import { ErrorDeApi, ErrorDeConexion } from "../api/client";
import { guardarCache, leerCache } from "../lib/cache";
import type { MotivoDescarte, Pedido } from "../types/modelo";
import { MOTIVOS_DESCARTE, etiquetaMotivoDescarte } from "../lib/motivosDescarte";
import { colores, espaciado, radio, tipografia } from "../theme/theme";

type RutaDetalle = RouteProp<RootStackParamList, "PedidoDetalle">;
type Navegacion = NativeStackNavigationProp<RootStackParamList, "PedidoDetalle">;

const VENTANA_DESHACER_MS = 8000;

export function PedidoDetalleScreen() {
  const { params } = useRoute<RutaDetalle>();
  const navigation = useNavigation<Navegacion>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinConexion, setSinConexion] = useState(false);

  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [confirmacionDatos, setConfirmacionDatos] = useState(false);

  const [nombreNuevoCliente, setNombreNuevoCliente] = useState("");
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  const [respondiendo, setRespondiendo] = useState(false);

  const [mostrandoMotivos, setMostrandoMotivos] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [deshacerVisible, setDeshacerVisible] = useState(false);
  const temporizadorDeshacer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [domicilioElegidoId, setDomicilioElegidoId] = useState<string | null>(null);
  const [usarDireccionNueva, setUsarDireccionNueva] = useState(false);
  const [direccionNueva, setDireccionNueva] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [fechaParcial, setFechaParcial] = useState<Date | null>(null);
  const [pasoSelector, setPasoSelector] = useState<"ninguno" | "fecha" | "hora">("ninguno");
  const [agendando, setAgendando] = useState(false);
  const [errorAgendar, setErrorAgendar] = useState<string | null>(null);

  const claveCache = `pedido:${params.pedidoId}`;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerPedido(params.pedidoId);
      await guardarCache(claveCache, datos.pedido);
      setSinConexion(false);
      setPedido(datos.pedido);
      setTelefono(datos.pedido.telefonoDetectado ?? "");
      setMotivo(datos.pedido.motivo ?? "");
      const primerDomicilio = datos.pedido.cliente?.domicilios?.[0];
      if (primerDomicilio) setDomicilioElegidoId(primerDomicilio.id);
    } catch (err) {
      if (err instanceof ErrorDeConexion) {
        const cache = await leerCache<Pedido>(claveCache);
        if (cache) {
          setSinConexion(true);
          setPedido(cache);
          setTelefono(cache.telefonoDetectado ?? "");
          setMotivo(cache.motivo ?? "");
          return;
        }
      }
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  }, [params.pedidoId, claveCache]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    return () => {
      if (temporizadorDeshacer.current) clearTimeout(temporizadorDeshacer.current);
    };
  }, []);

  async function guardarDatos() {
    if (!pedido) return;
    setGuardandoDatos(true);
    setError(null);
    setConfirmacionDatos(false);
    try {
      const resultado = await actualizarPedido(pedido.id, {
        telefono: telefono.trim(),
        motivo: motivo.trim(),
      });
      setPedido(resultado.pedido);
      setConfirmacionDatos(true);
      setTimeout(() => setConfirmacionDatos(false), 3000);
    } catch (err) {
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setGuardandoDatos(false);
    }
  }

  async function darDeAltaCliente() {
    if (!pedido || !pedido.telefonoDetectado) return;
    if (!nombreNuevoCliente.trim()) {
      setErrorAlta("Poné un nombre para el cliente.");
      return;
    }
    setDandoDeAlta(true);
    setErrorAlta(null);
    try {
      const { cliente } = await crearCliente({
        nombre: nombreNuevoCliente.trim(),
        telefono: pedido.telefonoDetectado,
      });
      const resultado = await actualizarPedido(pedido.id, { clienteId: cliente.id });
      setPedido(resultado.pedido);
      setNombreNuevoCliente("");
    } catch (err) {
      setErrorAlta(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setDandoDeAlta(false);
    }
  }

  async function responderPorWhatsApp() {
    if (!pedido) return;
    if (!pedido.telefonoDetectado) {
      setError("Agregá un teléfono para poder escribirle por WhatsApp.");
      return;
    }
    setRespondiendo(true);
    setError(null);
    try {
      await Linking.openURL(`https://wa.me/${pedido.telefonoDetectado}`);
    } catch {
      setError("No se pudo abrir WhatsApp en este equipo.");
      setRespondiendo(false);
      return;
    }
    if (pedido.estado === "nuevo") {
      try {
        const resultado = await responderPedido(pedido.id);
        setPedido(resultado.pedido);
      } catch {
        // Ya se abrió el chat; si no hay conexión para registrar el cambio de
        // estado no lo mostramos como un error del botón "Responder".
      }
    }
    setRespondiendo(false);
  }

  async function descartar(motivoElegido: MotivoDescarte) {
    if (!pedido) return;
    setDescartando(true);
    setError(null);
    try {
      const resultado = await descartarPedido(pedido.id, motivoElegido);
      setPedido(resultado.pedido);
      setMostrandoMotivos(false);
      setDeshacerVisible(true);
      if (temporizadorDeshacer.current) clearTimeout(temporizadorDeshacer.current);
      temporizadorDeshacer.current = setTimeout(() => setDeshacerVisible(false), VENTANA_DESHACER_MS);
    } catch (err) {
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setDescartando(false);
    }
  }

  async function deshacer() {
    if (!pedido) return;
    setError(null);
    try {
      const resultado = await deshacerDescarte(pedido.id);
      setPedido(resultado.pedido);
      setDeshacerVisible(false);
      if (temporizadorDeshacer.current) clearTimeout(temporizadorDeshacer.current);
    } catch (err) {
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    }
  }

  function cambioSelector(evento: { type: string }, valor?: Date) {
    if (evento.type === "dismissed" || !valor) {
      setPasoSelector("ninguno");
      return;
    }
    if (pasoSelector === "fecha") {
      setFechaParcial(valor);
      setPasoSelector("hora");
      return;
    }
    const combinada = new Date(fechaParcial ?? valor);
    combinada.setHours(valor.getHours(), valor.getMinutes());
    setFecha(combinada);
    setPasoSelector("ninguno");
  }

  async function agendar() {
    if (!pedido) return;
    if (!fecha) {
      setErrorAgendar("Elegí una fecha para la visita.");
      return;
    }
    if (!usarDireccionNueva && !domicilioElegidoId && !direccionNueva.trim()) {
      setErrorAgendar("Elegí una dirección o cargá una nueva.");
      return;
    }
    setAgendando(true);
    setErrorAgendar(null);
    try {
      const resultado = await convertirEnVisita(pedido.id, {
        fecha: fecha.toISOString(),
        domicilioId: !usarDireccionNueva && domicilioElegidoId ? domicilioElegidoId : undefined,
        direccionNueva: usarDireccionNueva ? direccionNueva.trim() : undefined,
        motivo: motivo.trim() || undefined,
      });
      setPedido(resultado.pedido);
    } catch (err) {
      setErrorAgendar(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setAgendando(false);
    }
  }

  if (cargando) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>Cargando el pedido…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !pedido) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.centro}>
          <Text style={estilos.textoError}>{error}</Text>
          <View style={estilos.espacioBoton}>
            <BotonGrande titulo="Reintentar" onPress={cargar} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!pedido) return null;

  const puedeActuar = pedido.estado !== "descartado" && pedido.estado !== "agendado";
  const domicilios = pedido.cliente?.domicilios ?? [];

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>Pedido</Text>
          <EstadoTag estado={pedido.estado} />
        </View>

        {sinConexion && (
          <View style={estilos.avisoSinConexion}>
            <Text style={estilos.avisoSinConexionTexto}>
              Sin conexión — estás viendo la última copia guardada. Para guardar cambios, responder,
              descartar o agendar necesitás señal.
            </Text>
          </View>
        )}

        <CampoTexto
          etiqueta="Mensaje original del cliente"
          valor={pedido.textoOriginal ?? "Este pedido se cargó a mano, sin mensaje pegado."}
          onCambiar={() => {}}
          soloLectura
          multilinea
        />

        <CampoTexto etiqueta="Teléfono" valor={telefono} onCambiar={setTelefono} teclado="phone-pad" />
        <CampoTexto etiqueta="¿Qué necesita?" valor={motivo} onCambiar={setMotivo} />

        {error && <Text style={estilos.error}>{error}</Text>}
        {confirmacionDatos && <Text style={estilos.confirmacion}>Datos guardados.</Text>}

        <BotonGrande
          titulo="Guardar datos"
          onPress={guardarDatos}
          cargando={guardandoDatos}
          deshabilitado={sinConexion}
        />

        <View style={estilos.separador} />

        {pedido.cliente ? (
          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Cliente</Text>
            <Text style={estilos.textoPrincipal}>{pedido.cliente.nombre}</Text>
            <Text style={estilos.textoSecundario}>{pedido.cliente.telefono}</Text>

            <Text style={[estilos.subtitulo, estilos.espacioArriba]}>Visitas anteriores</Text>
            {pedido.cliente.visitas && pedido.cliente.visitas.length > 0 ? (
              pedido.cliente.visitas.map((visita) => (
                <Text key={visita.id} style={estilos.textoSecundario}>
                  {new Date(visita.fecha).toLocaleDateString("es-AR")} — {visita.motivo}
                </Text>
              ))
            ) : (
              <Text style={estilos.textoSecundario}>Todavía no tiene visitas anteriores.</Text>
            )}
          </View>
        ) : pedido.telefonoDetectado ? (
          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Este número no está en tus clientes</Text>
            <CampoTexto
              etiqueta="Nombre del cliente"
              valor={nombreNuevoCliente}
              onCambiar={setNombreNuevoCliente}
              placeholder="Nombre y apellido"
            />
            {errorAlta && <Text style={estilos.error}>{errorAlta}</Text>}
            <BotonGrande
              titulo="Dar de alta cliente"
              onPress={darDeAltaCliente}
              cargando={dandoDeAlta}
              deshabilitado={sinConexion}
            />
          </View>
        ) : (
          <Text style={estilos.textoSecundario}>
            Agregá un teléfono arriba para poder asociarlo a un cliente.
          </Text>
        )}

        <View style={estilos.separador} />

        {puedeActuar && (
          <View style={estilos.bloque}>
            <Text style={estilos.subtitulo}>Acciones</Text>

            <BotonGrande
              titulo="Responder por WhatsApp"
              onPress={responderPorWhatsApp}
              cargando={respondiendo}
              variante="secundario"
            />

            {!mostrandoMotivos ? (
              <BotonGrande
                titulo="Descartar pedido"
                variante="peligro"
                deshabilitado={sinConexion}
                onPress={() => setMostrandoMotivos(true)}
              />
            ) : (
              <View style={estilos.bloque}>
                <Text style={estilos.textoPrincipal}>¿Por qué se descarta?</Text>
                {MOTIVOS_DESCARTE.map((m) => (
                  <BotonGrande
                    key={m.clave}
                    titulo={m.etiqueta}
                    variante="secundario"
                    cargando={descartando}
                    deshabilitado={sinConexion}
                    onPress={() => descartar(m.clave)}
                  />
                ))}
                <BotonGrande titulo="No descartar" variante="secundario" onPress={() => setMostrandoMotivos(false)} />
              </View>
            )}

            <View style={estilos.separador} />

            <Text style={estilos.subtitulo}>Agendar visita</Text>
            {!pedido.clienteId ? (
              <Text style={estilos.textoSecundario}>
                Para agendar la visita primero necesitás asociar un cliente (arriba).
              </Text>
            ) : (
              <>
                <Text style={estilos.textoPrincipal}>Dirección</Text>
                {domicilios.length > 0 && !usarDireccionNueva && (
                  <View style={estilos.bloque}>
                    {domicilios.map((d) => (
                      <Pressable
                        key={d.id}
                        onPress={() => setDomicilioElegidoId(d.id)}
                        accessibilityRole="button"
                        style={[
                          estilos.opcionDomicilio,
                          domicilioElegidoId === d.id && estilos.opcionDomicilioElegida,
                        ]}
                      >
                        <Text style={estilos.textoPrincipal}>{d.direccion}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {(domicilios.length === 0 || usarDireccionNueva) && (
                  <CampoTexto
                    etiqueta="Dirección nueva"
                    valor={direccionNueva}
                    onCambiar={setDireccionNueva}
                    placeholder="Calle, número, localidad"
                  />
                )}
                {domicilios.length > 0 && (
                  <BotonGrande
                    titulo={usarDireccionNueva ? "Usar una dirección guardada" : "Cargar otra dirección"}
                    variante="secundario"
                    onPress={() => setUsarDireccionNueva((v) => !v)}
                  />
                )}

                <Text style={[estilos.textoPrincipal, estilos.espacioArriba]}>Fecha y hora</Text>
                <BotonGrande
                  titulo={fecha ? fecha.toLocaleString("es-AR") : "Elegir fecha y hora"}
                  variante="secundario"
                  onPress={() => setPasoSelector("fecha")}
                />
                {pasoSelector !== "ninguno" && (
                  <DateTimePicker
                    value={pasoSelector === "fecha" ? fecha ?? new Date() : fechaParcial ?? new Date()}
                    mode={pasoSelector === "fecha" ? "date" : "time"}
                    onChange={(evento, valor) => cambioSelector(evento, valor)}
                  />
                )}

                {errorAgendar && <Text style={estilos.error}>{errorAgendar}</Text>}
                <BotonGrande
                  titulo="Agendar visita"
                  onPress={agendar}
                  cargando={agendando}
                  deshabilitado={sinConexion}
                />
              </>
            )}
          </View>
        )}

        {pedido.estado === "descartado" && (
          <View style={estilos.bloque}>
            <Text style={estilos.textoPrincipal}>
              Pedido descartado — {etiquetaMotivoDescarte(pedido.motivoDescarte)}
            </Text>
            {deshacerVisible && <BotonGrande titulo="Deshacer" variante="secundario" onPress={deshacer} />}
          </View>
        )}

        {pedido.estado === "agendado" && pedido.visita && (
          <View style={estilos.bloque}>
            <Text style={estilos.textoPrincipal}>Este pedido ya tiene una visita agendada.</Text>
            <BotonGrande
              titulo="Ver visita agendada"
              onPress={() => navigation.navigate("VisitaDetalle", { visitaId: pedido.visita!.id })}
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
  encabezado: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: espaciado.sm },
  titulo: { fontSize: tipografia.titulo, fontWeight: "800", color: colores.texto },
  subtitulo: { fontSize: tipografia.subtitulo, fontWeight: "700", color: colores.texto },
  textoPrincipal: { fontSize: tipografia.base, color: colores.texto },
  textoSecundario: { fontSize: tipografia.base, color: colores.textoSecundario },
  textoError: { fontSize: tipografia.base, color: colores.alerta, textAlign: "center" },
  error: { fontSize: tipografia.base, color: colores.alerta },
  confirmacion: { fontSize: tipografia.base, color: colores.estados.agendado.texto, fontWeight: "700" },
  avisoSinConexion: {
    backgroundColor: colores.alertaFondo,
    borderRadius: radio,
    padding: espaciado.sm,
  },
  avisoSinConexionTexto: { color: colores.alerta, fontSize: tipografia.chico, fontWeight: "700" },
  espacioBoton: { marginTop: espaciado.lg, alignSelf: "stretch" },
  espacioArriba: { marginTop: espaciado.sm },
  separador: { height: 1, backgroundColor: colores.borde },
  bloque: { gap: espaciado.sm },
  opcionDomicilio: {
    borderWidth: 2,
    borderColor: colores.borde,
    borderRadius: radio,
    padding: espaciado.md,
    minHeight: 56,
    justifyContent: "center",
  },
  opcionDomicilioElegida: { borderColor: colores.primario, backgroundColor: colores.tarjeta },
});
