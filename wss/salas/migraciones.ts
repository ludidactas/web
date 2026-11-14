import { AccesoSala, MetodosLogin } from '../validators/auth'
import type { Migracion } from '../versionado'

/**
 * v0 → v1: `config.solo_invitados` (booleano) pasa a `config.acceso`.
 * `true` es `lista`. `false` es `invitados` en DNI y Google, donde la lista ya anotaba a los invitados,
 * y `libre` en nombre, que no tenía lista.
 */
export const soloInvitadosAAcceso: Migracion = (doc) => {
  const { solo_invitados, ...config } = (doc.config ?? {}) as Record<string, unknown>
  const acceso = solo_invitados
    ? AccesoSala.Lista
    : config.metodo_login === MetodosLogin.Nombre || config.metodo_login === undefined
      ? AccesoSala.Libre
      : AccesoSala.Invitados
  return { ...doc, config: { ...config, acceso } }
}

/** Migraciones del documento de sala, en orden: la versión actual es su cantidad. */
export const migracionesSala: Migracion[] = [soloInvitadosAAcceso]
