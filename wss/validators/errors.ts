export enum TipoErrorSesion {
  SalaNoExiste   = 'sala_no_existe',
  DniNoPermitido = 'dni_no_permitido',
  DniRequerido   = 'dni_requerido',
  NombreEnUso    = 'nombre_en_uso',
  TokenInvalido  = 'token_invalido',
  AuthInvalido   = 'auth_invalido',
  DniYaConectado = 'dni_ya_conectado',
}

export class ErrorSesion extends Error {
  constructor(public readonly tipo: TipoErrorSesion, message: string) {
    super(message)
    this.name = 'ErrorSesion'
  }
}
