export enum TipoErrorSesion {
  SalaNoExiste = 'sala_no_existe',
  DniNoPermitido = 'dni_no_permitido',
  EmailNoPermitido = 'email_no_permitido',
  NombreEnUso = 'nombre_en_uso',
  AuthInvalido = 'auth_invalido',
}

export class ErrorSesion extends Error {
  constructor(public readonly tipo: TipoErrorSesion, message: string) {
    super(message)
    this.name = 'ErrorSesion'
  }
}

/**
 * El profe alcanzó el límite de salas de su plan. Es un error de negocio (no de sesión): el front
 * lo usa para mostrar el upsell de suscripción en vez de un error genérico.
 */
export class LimiteSalasAlcanzado extends Error {
  readonly tipo = 'limite_salas' as const
  constructor(
    public readonly maxSalas: number,
    // message = `Alcanzaste el límite de ${maxSalas} sala(s) de tu plan. Suscribite para crear más.`
    message = `Alcanzaste el límite de ${maxSalas} sala(s). Estamos trabajando para permitirte crear más.`
  ) {
    super(message)
    this.name = 'LimiteSalasAlcanzado'
  }
}
