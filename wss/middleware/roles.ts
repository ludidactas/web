import { DefaultEventsMap, Socket } from 'socket.io'
import { ConfigSala } from '../validators/salas'
import { WssEstudianteSession, WssProfeSession } from '../validators/session'

/** Scoket con sesión de profe. Además de .session puede tener .config_sala */
export type SocketProfe = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  {
    session: WssProfeSession
    /** _Puede_ venir la config de la sala al momento de crearla */
    config_sala?: Partial<ConfigSala>
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