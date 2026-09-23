import { randomUUID } from 'crypto'
import { mergeDeep } from 'remeda'

import { RemoteSocket } from 'socket.io'
import { io } from '../server'
import { SocketProfe } from '../middleware/roles'
import { MetodosLogin, RolSala } from '../validators/auth'
import { configActualizable, configSala, ConfigSala, SalaData } from '../validators/salas'
import { CONFIG_DEFAULTS } from '../validators/overlay'
import { WssEstudianteSession } from '../validators/session'
import { ListaPermitidos } from '../invitados/app'

import * as db from './db'
import { reconstruirIntervalos } from '../asistencia/evaluacion'
import { ErrorSesion, TipoErrorSesion } from '../validators/errors'
import { RemoteSocketConSesion } from '../middleware/session'

export type { SalaData } from './db'

export type Sala = Awaited<ReturnType<typeof Salas.get>>

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Salas {
  /**
   * Devuelve la sala con las funciones para operar sobre ella. Si la sala no existe, lanza un error.
   *
   * @param salaId el id de la sala a obtener. Es la única info capturada en scope (¡no hay que capturar nada mutable! por eso pasamos el id y no la sala en sí)
   * @returns un objeto con funciones para operar sobre la sala, como `broadcast` para enviar mensajes a todos los clientes de la sala, o `listarEstudiantes` para obtener la lista de estudiantes conectados.
   */
  export async function get(salaId: string) {
    /** Devuelve una referencia fresca a la info más updateada en DB de la sala */
    async function getFromDb() {
      const sala = await db.getSala(salaId)
      if (!sala) throw new Error(`La sala ${salaId} no existe`)
      return sala
    }

    /**
     * Envía a admin, profe y estudiantes de la sala
     *
     * @param event El evento a emitir
     * @param data La data a emitir. Debería ser un objeto serializable.
     * @param [mapper=async (data) => data] Función opcional para mapear los datos a enviar a cada socket, en caso de que queramos enviar data personalizada a cada uno. Recibe la data original y el socket, y debe devolver la data a enviar a ese socket. Lo usamos principalmente para adjuntar a cada estudiante el estado de sus respuestas cuando broadcasteamos una pregunta.
     */
    async function broadcast(
      event: string,
      data: unknown,
      mapper: (data: unknown, socket: RemoteSocket<any, any>) => Promise<any> = async (data) => data
    ) {
      console.log(`📡 Broadcasteando evento '${event}' en sala ${salaId}`)

      const enviarMapeado = async (s: RemoteSocket<any, any>) => s.emit(event, await mapper(data, s))

      const sockets = await io.to(`sala:${salaId}`).fetchSockets()

      await Promise.all(sockets.map(enviarMapeado))
    }

    /** `userIds` de los estudiantes con un socket vivo ahora mismo (cluster-wide). */
    async function userIdsConectados() {
      const sockets = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
      return new Set(sockets.map((s) => s.data.session.userId))
    }

    /**
     * Indica si al `userId` le queda algún socket vivo, excluyendo `excluirSocketId`. Se usa al
     * desconectar para no marcar al estudiante como desconectado si sigue presente en otra pestaña/
     * clientId. Excluimos por id porque el socket que se desconecta puede seguir apareciendo en
     * `fetchSockets` por un instante (propagación del adapter).
     */
    async function sigueConectado(userId: string, excluirSocketId?: string) {
      const sockets = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
      return sockets.some((s) => s.data.session.userId === userId && s.id !== excluirSocketId)
    }

    /** Si al profe le queda algún socket vivo, excluyendo `excluirSocketId` (ver `sigueConectado`: el
     * mismo motivo, para no confundir la propagación del adapter con que el profe sigue conectado). */
    async function profeConectado(excluirSocketId?: string) {
      const sockets = await io.in(`sala:${salaId}:profe`).fetchSockets()
      return sockets.some((s) => s.id !== excluirSocketId)
    }

    /**
     * Devuelve la planilla de estudiantes de la sala: todos los que pasaron por ella (incluye
     * desconectados, con su sesión persistida), anotando `conectado` según tengan o no un socket
     * vivo ahora mismo. La presencia se deduce de los sockets, no se almacena.
     */
    async function listarEstudiantes() {
      const planilla = await db.getEstudiantes(salaId)
      const conectados = await userIdsConectados()

      return Object.values(planilla).map((session) => ({
        ...session,
        conectado: conectados.has(session.userId),
      }))
    }

    /** Se ocupa de kickear a los estudiantes que queden fuera luego de un cambio de auth (lista de permitido) */
    async function sanitizar() {
      const sala = await getFromDb()

      // Solo aplica cuando la sala no autentica solo por nombre y restringe a la lista de invitados
      if (sala.config.metodo_login === MetodosLogin.Nombre || !sala.config.solo_invitados) return

      // Pasado este punto estamos verificando si el userId de cada socket de estudiante está autorizado en la lista de permitidos
      // (que a su vez se basa en el campo de identidad del metodo_login de la sala, que para DNI es el dni y para Google es el email)
      const permitidos = await ListaPermitidos.para(salaId).obtener()

      // Seleccionamos los sockets de estudiantes cuyo userId no esté en la lista de permitidos.
      const sockets = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
      const noPermitidos = sockets.filter(
        (s: RemoteSocketConSesion) =>
          s.data.session.rol === RolSala.Estudiante && !permitidos.includes(s.data.session.userId)
      )

      if (noPermitidos.length === 0) return

      console.warn(
        `⚠️  Kickeando estudiantes no permitidos en sala ${salaId}:`,
        noPermitidos.map((s) => s.data.session.userId)
      )

      // Los kickeamos
      noPermitidos.forEach((s) => {
        s.emit('sala:kick', {
          motivo: `Tu ${
            sala.config.metodo_login === MetodosLogin.DNI ? 'DNI' : 'email'
          } ya no está en la lista de participantes permitidos.`,
        })
        s.disconnect()
      })
    }

    /**
     * Registra el ingreso del estudiante: lo persiste en la planilla durable de la sala y anota su
     * conexión en el log de asistencia.
     */
    async function registrarIngreso(session: WssEstudianteSession) {
      await db.guardarEstudiante(salaId, session)
      await db.registrarEventoAsistencia(salaId, session.userId, 'conexion', Date.now())
    }

    /** Anota la desconexión del estudiante en el log de asistencia. */
    async function registrarDesconexion(userId: string) {
      await db.registrarEventoAsistencia(salaId, userId, 'desconexion', Date.now())
    }

    /** Devuelve, por userId, los intervalos de conexión reconstruidos del log de asistencia. */
    async function intervalosDeConexion() {
      return reconstruirIntervalos(await db.getEventosAsistencia(salaId))
    }

    async function actualizarConfig(payload: unknown) {
      const sala = await getFromDb()

      // Validamos: solo se pueden tocar los campos mutables.
      const config = configActualizable.partial().parse(payload)
      const configActual = sala.config
      const merged = { ...mergeDeep(configActual, config) }

      for (const key of Object.keys(config)) {
        if ((config as Record<string, unknown>)[key] === null) delete (merged as Record<string, unknown>)[key]
      }

      const nuevaConfig = configSala.parse(merged)
      sala.config = nuevaConfig

      await db.guardarSala(sala)
    }

    return {
      id: salaId,

      /** Devuelve la sala actualizada */
      config: () => getFromDb().then((sala) => sala.config),

      /** Kickea a los estudiantes cuyo DNI/email no esté en la lista de permitidos actualizada */
      sanitizar,

      /** Devuelve la lista de estudiantes, y anota si están presentes */
      listarEstudiantes,

      /** Broadcastea un mensaje a todos los sockets en la sala */
      broadcast,

      /** Registra el ingreso del estudiante en la planilla durable de la sala (persiste su sesión) */
      registrarIngreso,

      /** Anota la desconexión del estudiante en el log de asistencia */
      registrarDesconexion,

      /** Indica si al estudiante le queda algún socket vivo (excluyendo el `socketId` dado) */
      sigueConectado,

      /** Indica si el profe tiene algún socket vivo ahora mismo */
      profeConectado,

      /** Devuelve, por userId, los intervalos de conexión reconstruidos del log de asistencia */
      intervalosDeConexion,

      /** Valida lo que recibe y si pasa actualiza la config de la sala */
      actualizarConfig,

      /** Gestión de la lista de usuarios permitidos */
      listaPermitidos: () => ListaPermitidos.para(salaId),

      /** Devuelve solo la data serializable (sin funciones) */
      raw: getFromDb,

      profe: (await getFromDb()).profe,
    }
  }

  export async function existe(salaId: string) {
    return db.existeSala(salaId)
  }

  export async function assertExiste(salaId: string) {
    if (!(await existe(salaId))) throw new ErrorSesion(TipoErrorSesion.SalaNoExiste, `La sala ${salaId} no existe.`)
  }

  /** Crea una sala nueva y la asigna al profe del socket. Devuelve la sala lista para operar. */
  export async function crear(socket: SocketProfe, config: Omit<ConfigSala, 'nombre_profe' | 'link' | 'overlay'>) {
    const id = randomUUID().split('-')[0]
    const email = socket.data.session.email

    // Los defaults de creación (metodo_login, solo_invitados) los aplica `configCreacionSala` en el
    // caller; acá solo sumamos los campos que genera el server (incluida la config del overlay por defecto).
    const configCompleta: ConfigSala = {
      ...config,
      nombre_profe: socket.data.session.nombre || email,
      link: `${process.env.NEXT_PUBLIC_HOST}/sala/${id}/`,
      overlay: CONFIG_DEFAULTS,
    }

    const salaData: SalaData = {
      id,
      profe: { email, nombre: configCompleta.nombre_profe },
      config: configCompleta,
    }

    await db.guardarSala(salaData)
    await db.agregarSalaAProfe(email, id)

    console.log(`🏠 Sala ${id} creada para profe ${email}`)
    return await get(id)
  }

  /**
   * Elimina una sala: kickea a los clientes conectados, borra su data y sus claves derivadas, y
   * quita la relación con el profe. Se asume que el caller ya validó propiedad (`assertEsDueño`).
   */
  export async function eliminar(email: string, salaId: string) {
    const sockets = await io.in(`sala:${salaId}`).fetchSockets()
    sockets.forEach((s) => {
      s.emit('sala:kick', { motivo: 'La sala fue eliminada.' })
      s.disconnect()
    })
    await db.borrarSala(salaId)
    await db.eliminarSalaDeProfe(email, salaId)
    console.log(`🗑️  Sala ${salaId} eliminada por ${email}`)
  }

  /** Funciones de relaciones: */

  /** Devuelve todas las salas (data cruda) de un profe. Puede ser una lista vacía. */
  export async function getSalasDeProfe(email: string): Promise<SalaData[]> {
    const ids = await db.getIdsSalasDeProfe(email)
    const salas = await Promise.all(ids.map((id) => db.getSala(id)))
    return salas.filter((s): s is SalaData => s !== null)
  }

  /**
   * Verifica que `email` sea el dueño de la sala. Si no lo es (o la sala no existe) lanza
   * `SalaNoExiste` — tratamos "no es tuya" como "no existe" para no filtrar salas ajenas.
   */
  export async function assertEsDueño(email: string, salaId: string) {
    const dueño = await db.getEmailProfe(salaId)
    if (dueño !== email)
      throw new ErrorSesion(TipoErrorSesion.SalaNoExiste, `La sala ${salaId} no existe o no te pertenece.`)
  }
}
