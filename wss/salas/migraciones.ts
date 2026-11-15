import { AccesoSala, MetodosLogin } from '../validators/auth'
import type { Migracion } from '../versionado'

/**
 * v0 → v1: `config.solo_invitados` (booleano) pasa a `config.acceso`.
 * En nombre, que no tenía lista y aplicaba `solo_invitados` a nadie, el acceso es siempre `libre`. En
 * DNI y Google, `true` es `lista` y `false` es `invitados` (la lista ya anotaba a los invitados).
 */
export const soloInvitadosAAcceso: Migracion = (doc) => {
  const { solo_invitados, ...config } = (doc.config ?? {}) as Record<string, unknown>
  const acceso =
    config.metodo_login === MetodosLogin.Nombre || config.metodo_login === undefined
      ? AccesoSala.Libre
      : solo_invitados
        ? AccesoSala.Lista
        : AccesoSala.Invitados
  return { ...doc, config: { ...config, acceso } }
}

/** Migraciones del documento de sala, en orden: la versión actual es su cantidad. */
export const migracionesSala: Migracion[] = [soloInvitadosAAcceso]
