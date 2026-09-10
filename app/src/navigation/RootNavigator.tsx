import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BandejaScreen } from "../screens/BandejaScreen";
import { NuevoPedidoScreen } from "../screens/NuevoPedidoScreen";
import { PedidoDetalleScreen } from "../screens/PedidoDetalleScreen";
import { VisitaDetalleScreen } from "../screens/VisitaDetalleScreen";
import { ResumenScreen } from "../screens/ResumenScreen";
import { colores } from "../theme/theme";

export type RootStackParamList = {
  Bandeja: undefined;
  NuevoPedido: undefined;
  PedidoDetalle: { pedidoId: string };
  VisitaDetalle: { visitaId: string };
  Resumen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: "Atrás",
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="Bandeja" component={BandejaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NuevoPedido" component={NuevoPedidoScreen} options={{ title: "Cargar pedido" }} />
        <Stack.Screen name="PedidoDetalle" component={PedidoDetalleScreen} options={{ title: "Pedido" }} />
        <Stack.Screen name="VisitaDetalle" component={VisitaDetalleScreen} options={{ title: "Visita" }} />
        <Stack.Screen name="Resumen" component={ResumenScreen} options={{ title: "Resumen" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
