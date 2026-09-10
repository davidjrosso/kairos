import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BotonGrande } from "../components/BotonGrande";
import { obtenerResumen, type Resumen } from "../api/resumen";
import { ErrorDeApi } from "../api/client";
import { colores, espaciado, radio, tipografia } from "../theme/theme";

type Periodo = { etiqueta: string; dias: number | null };

const PERIODOS: Periodo[] = [
  { etiqueta: "Últimos 7 días", dias: 7 },
  { etiqueta: "Últimos 30 días", dias: 30 },
  { etiqueta: "Todo", dias: null },
];

function calcularDesde(dias: number | null): string {
  if (dias === null) return new Date(0).toISOString();
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString();
}

export function ResumenScreen() {
  const [periodo, setPeriodo] = useState<Periodo>(PERIODOS[0]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (p: Periodo) => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerResumen(calcularDesde(p.dias), new Date().toISOString());
      setResumen(datos);
    } catch (err) {
      setError(err instanceof ErrorDeApi ? err.message : "Algo falló. Probá de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(periodo);
  }, [cargar, periodo]);

  const porcentajeConvertido = resumen ? Math.round(resumen.proporcionConvertida * 100) : 0;

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo}>Resumen</Text>

        <View style={estilos.filaPeriodos}>
          {PERIODOS.map((p) => (
            <View key={p.etiqueta} style={estilos.botonPeriodo}>
              <BotonGrande
                titulo={p.etiqueta}
                variante={p.etiqueta === periodo.etiqueta ? "primario" : "secundario"}
                onPress={() => setPeriodo(p)}
              />
            </View>
          ))}
        </View>

        {cargando && <Text style={estilos.textoSecundario}>Calculando…</Text>}
        {error && <Text style={estilos.textoError}>{error}</Text>}

        {resumen && !cargando && (
          <View style={estilos.tarjetas}>
            <Tarjeta numero={resumen.recibidos} etiqueta="Pedidos recibidos" />
            <Tarjeta numero={resumen.agendados} etiqueta="Agendados" />
            <Tarjeta numero={resumen.descartados} etiqueta="Descartados" />
            <Tarjeta numero={resumen.pendientes} etiqueta="Todavía sin decisión" />
            <Tarjeta numero={`${porcentajeConvertido}%`} etiqueta="De los recibidos terminó agendado" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tarjeta({ numero, etiqueta }: { numero: number | string; etiqueta: string }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.numero}>{numero}</Text>
      <Text style={estilos.etiquetaTarjeta}>{etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espaciado.md, gap: espaciado.md },
  titulo: { fontSize: tipografia.titulo, fontWeight: "800", color: colores.texto },
  filaPeriodos: { gap: espaciado.sm },
  botonPeriodo: { width: "100%" },
  textoSecundario: { fontSize: tipografia.base, color: colores.textoSecundario },
  textoError: { fontSize: tipografia.base, color: colores.alerta },
  tarjetas: { gap: espaciado.md },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espaciado.md,
    gap: espaciado.xs,
  },
  numero: { fontSize: tipografia.titulo, fontWeight: "800", color: colores.primario },
  etiquetaTarjeta: { fontSize: tipografia.base, color: colores.texto },
});
