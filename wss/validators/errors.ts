export enum TipoErrorSesion {
  SalaNoExiste   = 'sala_no_existe',
  DniNoPermitido = 'dni_no_permitido',
  DniRequerido   = 'dni_requerido',
  NombreEnUso    = 'nombre_en_uso',
  TokenInvalido  = 'token_invalido',
}

export enum AccionErrorSesion {
  LimpiarSesion = 'clear_session',
  Rechazado     = 'rejected',
  NombreEnUso   = 'nombre_en_uso',
  DniRequerido  = 'dni_required',
}

export interface ErrorSesionData {
  type: 'SessionError'
  action: AccionErrorSesion
  message: string
}

export class ErrorSesion extends Error {
  constructor(public readonly tipo: TipoErrorSesion, message: string) {
    super(message)
    this.name = 'ErrorSesion'
  }
}

const mapaAcciones: Record<TipoErrorSesion, AccionErrorSesion> = {
  [TipoErrorSesion.SalaNoExiste]:   AccionErrorSesion.Rechazado,
  [TipoErrorSesion.DniNoPermitido]: AccionErrorSesion.Rechazado,
  [TipoErrorSesion.DniRequerido]:   AccionErrorSesion.DniRequerido,
  [TipoErrorSesion.NombreEnUso]:    AccionErrorSesion.NombreEnUso,
  [TipoErrorSesion.TokenInvalido]:  AccionErrorSesion.LimpiarSesion,
}

export const accionDeError = (err: unknown): AccionErrorSesion =>
  err instanceof ErrorSesion ? mapaAcciones[err.tipo] : AccionErrorSesion.Rechazado