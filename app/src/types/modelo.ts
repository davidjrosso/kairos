export type Estado = "nuevo" | "respondido" | "agendado" | "descartado";

export type MotivoDescarte = "no_era_para_mi" | "quedo_caro" | "no_contesto" | "lo_hizo_otro";

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  createdAt: string;
  visitas?: Visita[];
  domicilios?: Domicilio[];
};

export type Domicilio = {
  id: string;
  clienteId: string;
  direccion: string;
  createdAt: string;
};

export type Pedido = {
  id: string;
  textoOriginal: string | null;
  telefonoDetectado: string | null;
  motivo: string | null;
  clienteId: string | null;
  domicilioId: string | null;
  estado: Estado;
  motivoDescarte: MotivoDescarte | null;
  descartadoEn: string | null;
  respondidoEn: string | null;
  agendadoEn: string | null;
  createdAt: string;
  updatedAt: string;
  cliente?: Cliente | null;
  domicilio?: Domicilio | null;
  visita?: Visita | null;
  demorado?: boolean;
};

export type GrupoBandeja = {
  clienteId: string | null;
  clienteNombre: string | null;
  telefono: string | null;
  pedidos: Pedido[];
  cantidadAbiertos: number;
  ultimoPedidoEn: string;
};

export type Visita = {
  id: string;
  clienteId: string;
  domicilioId: string;
  motivo: string;
  fecha: string;
  pedidoOrigenId: string | null;
  createdAt: string;
  cliente?: Cliente;
  domicilio?: Domicilio;
  pedidoOrigen?: Pedido | null;
};
