# convention

A rule the codebase follows — naming, patterns, and where things live.

## Todo el código de la bandeja se escribe en español (nombres, textos, UI)

- **What**: Variables, funciones, componentes, rutas y todos los textos visibles del server y de la app están en español (`server/src/routes/pedidos.ts`, `app/src/screens/BandejaScreen.tsx`, etc.), salvo palabras reservadas del lenguaje/framework.
- **Why**: El work order y el usuario final (el profesional) son hispanohablantes; mantener el código en el mismo idioma que los textos de UI evita traducir mentalmente entre el dominio y el código, y reduce el riesgo de mezclar jerga técnica en inglés en un texto visible por error (requisito explícito de no usar jerga informática).
- **Where**: Todo `/app` y `/server`.
- **Learned**: —

## UI de la app: theme tokens + componentes grandes, sin truncar información crítica

- **What**: `app/src/theme/theme.ts` centraliza colores (alto contraste), espaciado y tipografía (base 18). `toqueMinimo = 56` es la altura mínima de cualquier zona tocable. `BotonGrande` (`app/src/components/BotonGrande.tsx`) es el único tipo de botón de la bandeja — nunca gestos ni menús de tres puntos. Ningún texto usa `allowFontScaling={false}`, para que la fuente del sistema al máximo siga funcionando.
- **Why**: Requisitos de accesibilidad del work order: alto contraste, botones grandes, uso con una mano/guantes, usable con la letra del sistema al máximo.
- **Where**: `app/src/theme/theme.ts`, `app/src/components/`.
- **Learned**: Los textos de previsualización (ej. el mensaje del cliente en la tarjeta de la bandeja) usan `numberOfLines` con `accessibilityLabel` con el texto completo — es una elipsis de UI intencional y navegable, no "texto cortado" en el sentido del requisito de accesibilidad (eso apunta a layouts que rompen con fuente grande, no a previsualizaciones).

## Auditoría de accesibilidad/lenguaje (fase final de la bandeja)

- **What**: Se revisaron todas las pantallas de `app/src/screens/` contra tres reglas: (1) ningún texto visible usa "estado", "sincronizar", "registro", "caché" o "convertir" — se verificó con grep, las únicas apariciones son en nombres de variables/funciones y comentarios de código, nunca en un `<Text>` o `titulo=`; (2) no hay `height` fijo en ningún estilo salvo un separador de 1px — todo es `minHeight` o intrínseco, así que un tamaño de letra grande empuja el layout en vez de cortarlo; (3) los encabezados con dos elementos en fila (`BandejaScreen`, `PedidoDetalleScreen`) tienen `flexWrap: "wrap"` para no desbordar si el texto crece mucho.
- **Why**: Cumple los requisitos de lenguaje del oficio y de usabilidad con la letra del sistema al máximo (AC14, AC16), sin poder probarlo en un dispositivo Android real dentro de esta sesión (no hay emulador/adb en este entorno — ver [[configs]]).
- **Where**: Todo `app/src/screens/` y `app/src/components/`.
- **Learned**: Esta auditoría fue estática (grep + lectura de estilos), no una prueba visual en dispositivo. Antes de publicar, alguien tiene que abrir la app en un Android real con la letra del sistema al máximo y recorrer las pantallas — no asumir que esto quedó 100% verificado solo porque el código sigue las convenciones.

