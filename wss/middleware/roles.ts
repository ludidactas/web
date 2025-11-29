import { DefaultEventsMap, ExtendedError, Socket } from "socket.io"
import { SocketConSesion, WssServerSession } from "./session"
import { RolEncuesta } from "../tipos"
import { ConfigSala } from "../salas/app"

/** Scoket con sesión de profe. Además de .session tiene .user y .config_sala */
export type SocketProfe = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, {
  session: WssServerSession
  user: { email: string, nombre?: string, dni?:string }
  /** _Puede_ venir la config de la sala al momento de crearla */
  config_sala?: Partial<ConfigSala> 
}>

/** Socket de estudiante. Además de .session tiene .sala con el id de la sala a la que se está conectando */
export type SocketEstudiante = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, {
  session: WssServerSession
  /** ID de la sala a la que se conecta el estudiante */
  sala: string
}>

/** Middleware para admitir solo admins */
export const esAdmin = (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  if (socket.data.session.rol !== RolEncuesta.Admin)
    next(new Error('Acción solo permitida para administradores'))
  next()
}

/** Middleware para admitir solo profes y admins */
export const esProfe = (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  if (socket.data.session.rol !== RolEncuesta.Profe && socket.data.session.rol !== RolEncuesta.Admin)
    next(new Error('Acción solo permitida para profes'))
  next()
}

