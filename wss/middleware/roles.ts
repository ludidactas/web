import { DefaultEventsMap, Socket } from 'socket.io'
import { WssEstudianteSession, WssProfeSession } from '../validators/session'

/** Socket con sesión de profe. `session.idSala` lleva la sala que está operando. */
export type SocketProfe = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  {
    session: WssProfeSession
  }
>

/** Socket de estudiante. Además de .session tiene .sala con el id de la sala a la que se está conectando */
export type SocketEstudiante = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  {
    session: WssEstudianteSession
  }
>