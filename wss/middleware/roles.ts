import { DefaultEventsMap, Socket } from 'socket.io'
import type { EventosEstudiante, EventosProfe } from '../contrato/eventos'
import type { ListenersDe } from '../contrato/definir'
import { WssEstudianteSession, WssProfeSession } from '../validators/session'

/**
 * Socket con sesión de profe. La sesión es identidad pura (email/nombre/rol). `salaActiva` es estado
 * EFÍMERO de esta conexión: la sala que el profe abrió con `sala:abrir` (validada como suya en ese
 * momento). No forma parte de la sesión/identidad; solo el server la setea.
 */
export type SocketProfe = Socket<
  DefaultEventsMap,
  ListenersDe<EventosProfe>,
  DefaultEventsMap,
  {
    session: WssProfeSession
    salaActiva?: string
  }
>

/** Socket de estudiante. Además de .session tiene .sala con el id de la sala a la que se está conectando */
export type SocketEstudiante = Socket<
  DefaultEventsMap,
  ListenersDe<EventosEstudiante>,
  DefaultEventsMap,
  {
    session: WssEstudianteSession
  }
>