import { DefaultEventsMap, ExtendedError, Socket } from 'socket.io'
import { RolEncuesta } from '../tipos'
import { ConfigSala } from '../validators/salas'
import { WssEstudianteSession, WssProfeSession } from '../validators/session'
import { SocketConSesion } from './session'

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

/** Middleware para admitir solo admins */
export const esAdmin = (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  if (socket.data.session.rol !== RolEncuesta.Admin) next(new Error('Acción solo permitida para administradores'))
  next()
}

/** Middleware para admitir solo profes y admins */
export const esProfeOAdmin = (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  if (socket.data.session.rol !== RolEncuesta.Profe && socket.data.session.rol !== RolEncuesta.Admin)
    next(new Error('Acción solo permitida para profes'))
  next()
}
