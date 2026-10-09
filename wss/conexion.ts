import { protegido } from './contrato/registrar'
import { handlersDojo } from './dojo/handlers'
import { handlersGoEstudiante } from './go/handlers'
import { esSocketEstudiante, esSocketProfe } from './middleware/roles'
import type { SocketConSesion } from './middleware/session'
import { handlersEncuestasEstudiante, handlersEncuestasOverlay } from './polls/handlers'
import { handlersAdmin, handlersGestionSalasProfe, handlersSalaEstudiante, handlersSalaPublico } from './salas/handlers'
import { RolSala } from './validators/auth'

/** Lo que corre una vez registrados los comandos de todos los grupos de la conexión (I/O de arranque). */
type Init = () => Promise<unknown> | unknown

/**
 * Un grupo de handlers: registra sus comandos sin esperar I/O y devuelve su init, si tiene. Registrar
 * todos los grupos antes de correr cualquier init evita perder un comando que el cliente emite apenas
 * conecta (ver docs/contrato-wss.md).
 */
type Grupo = () => Promise<Init | void> | Init | void

/** Los grupos de handlers de cada rol. El rol decide qué comandos acepta la conexión. */
function gruposDe(socket: SocketConSesion): Grupo[] {
  const { rol, idSala } = socket.handshake.auth

  // Dojo: visitante anónimo del dojo de Go, sin sesión ni sala.
  if (rol === RolSala.Dojo) return [() => handlersDojo(socket)]

  // Publico: sin sesión; el id de sala sirve para validar que exista y enviar la config pública.
  if (!socket.data?.session) {
    return [() => handlersSalaPublico(socket, idSala), () => handlersEncuestasOverlay(socket, idSala)]
  }

  // Estudiante: sesión de estudiante válida y permisos para la sala (chequeados en `conSession`).
  if (esSocketEstudiante(socket)) {
    const { idSala } = socket.data.session
    return [
      () => handlersSalaEstudiante(socket, idSala),
      () => handlersEncuestasEstudiante(socket, idSala),
      () => handlersGoEstudiante(socket, idSala),
    ]
  }

  // Profe: sesión de profe válida. Las encuestas y Go se cablean al abrir una sala
  // (`handlersGestionSalasProfe` → `handlersSalaActivaProfe`).
  if (esSocketProfe(socket)) return [() => handlersGestionSalasProfe(socket)]

  // Admin: sesión de admin válida.
  return [() => handlersAdmin(socket)]
}

/** Arma la conexión: registra los comandos de todos los grupos de su rol y después corre sus init. */
export async function conectar(socket: SocketConSesion) {
  const inits: Init[] = []
  for (const grupo of gruposDe(socket)) {
    const init = await grupo()
    if (init) inits.push(init)
  }
  for (const init of inits) await protegido(socket, init)
}
