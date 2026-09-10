import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { pedidosRouter } from "./routes/pedidos";
import { clientesRouter } from "./routes/clientes";
import { visitasRouter } from "./routes/visitas";
import { resumenRouter } from "./routes/resumen";
import { ErrorParaUsuario } from "./lib/errores";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/salud", (_req, res) => {
  res.json({ ok: true });
});

app.use("/pedidos", pedidosRouter);
app.use("/clientes", clientesRouter);
app.use("/visitas", visitasRouter);
app.use("/resumen", resumenRouter);

// Manejador de errores: siempre responde con un mensaje en lenguaje común,
// nunca con un stack trace o un código técnico.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ErrorParaUsuario) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Algo falló de nuestro lado. Probá de nuevo en un momento." });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Server escuchando en http://localhost:${port}`);
});

export default app;
