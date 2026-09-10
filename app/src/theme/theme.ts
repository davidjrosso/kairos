// Paleta y medidas pensadas para uso a la luz del sol, con una mano y con
// guantes o manos sucias: alto contraste, texto grande, zonas de toque amplias.
// Nunca fijar tamaños de fuente que ignoren la configuración del sistema
// (no usar allowFontScaling={false}) y evitar alturas fijas que corten texto.

export const colores = {
  fondo: "#FFFFFF",
  tarjeta: "#F7F4F1",
  texto: "#141414",
  textoSecundario: "#44403C",
  borde: "#D6D3D1",
  primario: "#B34700",
  primarioTexto: "#FFFFFF",
  alerta: "#B91C1C",
  alertaFondo: "#FEE2E2",
  estados: {
    nuevo: { fondo: "#DBEAFE", texto: "#1E3A8A" },
    respondido: { fondo: "#FEF3C7", texto: "#78350F" },
    agendado: { fondo: "#DCFCE7", texto: "#14532D" },
    descartado: { fondo: "#E7E5E4", texto: "#44403C" },
  },
} as const;

export const espaciado = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const tipografia = {
  chico: 15,
  base: 18,
  subtitulo: 20,
  titulo: 26,
} as const;

// Alto mínimo recomendado para una zona de toque cómoda con guantes.
export const toqueMinimo = 56;

export const radio = 12;
