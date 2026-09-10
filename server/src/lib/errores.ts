// Error con un mensaje ya pensado para mostrarse tal cual al profesional:
// en lenguaje común, sin códigos ni jerga técnica.
export class ErrorParaUsuario extends Error {
  status: number;

  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.status = status;
  }
}
