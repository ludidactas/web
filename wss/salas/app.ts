import { randomUUID } from 'crypto'
import { mergeDeep } from 'remeda'

import { RemoteSocket } from 'socket.io'
import { SocketProfe } from '../middleware/roles'
import { io } from '../server'
import { MetodosLogin, RolSala } from '../validators/auth'
import { configActualizable, ConfigSala } from '../validators/salas'
import { WssEstudianteSession } from '../validators/session'
import { ListaPermitidos } from '../invitados/app'

import * as db from './db'
import { ErrorSesion, TipoErrorSesion } from '../validators/errors'
import { RemoteSocketConSesion } from '../middleware/session'

export type { SalaData } from './db'

export type Sala = Awaited<ReturnType<typeof Salas.get>>

/**
 * Reconstruye, por userId, los intervalos durante los que el estudiante estuvo conectado, a partir
 * del log crudo de eventos. Usa un contador de profundidad (conexiones simultáneas): un intervalo va
 * desde que la profundidad pasa de 0→1 hasta que vuelve a 0. Así multi-tab cuenta como un solo
 * intervalo, y un 'desconexion' que nunca llegó (ej: crash) queda como intervalo abierto (`fin: null`).
 */
function reconstruirIntervalos(eventos: db.EventoAsistencia[]): Record<string, db.Intervalo[]> {
  const ordenados = [...eventos].sort((a, b) => a.ts - b.ts)
  const intervalos: Record<string, db.Intervalo[]> = {}
  const profundidad: Record<string, number> = {}

  for (const { userId, evento, ts } of ordenados) {
    const lista = (intervalos[userId] ??= [])
    const actual = profundidad[userId] ?? 0

    if (evento === 'conexion') {
      if (actual === 0) lista.push({ inicio: ts, fin: null })
      profundidad[userId] = actual + 1
    } else {
      profundidad[userId] = Math.max(0, actual - 1)
      const abierto = lista[lista.length - 1]
      if (profundidad[userId] === 0 && abierto && abierto.fin === null) abierto.fin = ts
    }
  }

  return intervalos
}

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
     * Purga de la planilla a los estudiantes desconectados, PERO conserva a los que están en la
     * lista de invitados (queremos seguir viéndolos aunque no estén conectados).
     */
    async function limpiarEstudiantes() {
      const planilla = await db.getEstudiantes(salaId)
      const conectados = await userIdsConectados()
      const invitados = await ListaPermitidos.para(salaId).obtener()

      // Borramos los desconectados que _NO_ estén en la lista de invitados
      const aBorrar = Object.keys(planilla).filter((userId) => !conectados.has(userId) && !invitados.includes(userId))
      if (aBorrar.length > 0) await db.borrarEstudiantes(salaId, aBorrar)
    }

    /**
     * Registra al estudiante en la planilla durable de la sala (persiste su sesión) y anota su
     * conexión en el log de asistencia.
     */
    async function registrarEstudiante(session: WssEstudianteSession) {
      await db.guardarEstudiante(salaId, session)
      await db.registrarEventoAsistencia(salaId, session.userId, 'conexion', Date.now())
    }

    /** Anota la desconexión del estudiante en el log de asistencia. */
    async function registrarDesconexion(userId: string) {
      await db.registrarEventoAsistencia(salaId, userId, 'desconexion', Date.now())
    }

    /** Devuelve, por userId, los intervalos de conexión reconstruidos del log de asistencia. */
    async function asistencia() {
      return reconstruirIntervalos(await db.getEventosAsistencia(salaId))
    }

    async function actualizarConfig(payload: unknown) {
      const sala = await getFromDb()

      // Validamos: solo se pueden tocar los campos mutables (hoy, `solo_invitados`).
      const config = configActualizable.partial().parse(payload)
      const configActual = sala.config
      const nuevaConfig = mergeDeep(configActual, config) as ConfigSala
      sala.config = nuevaConfig

      await db.guardarSala(sala)
    }

    return {
      id: salaId,

      /** Devuelve la sala actualizada */
      config: () => getFromDb().then((sala) => sala.config),

      /** Kickea a los estudiantes cuyo DNI/email no esté en la lista de permitidos actualizada */
      sanitizar,

      /** Borra los estudiantes desconectados de la lista */
      limpiarEstudiantes,

      /** Devuelve la lista de estudiantes, y anota si están presentes */
      listarEstudiantes,

      /** Broadcastea un mensaje a todos los sockets en la sala */
      broadcast,

      /** Registra al estudiante en la planilla durable de la sala (persiste su sesión) */
      registrarEstudiante,

      /** Anota la desconexión del estudiante en el log de asistencia */
      registrarDesconexion,

      /** Indica si al estudiante le queda algún socket vivo (excluyendo el `socketId` dado) */
      sigueConectado,

      /** Devuelve, por userId, los intervalos de conexión reconstruidos del log de asistencia */
      asistencia,

      /** Valida lo que recibe y si pasa actualiza la config de la sala */
      actualizarConfig,

      /** Gestión de la lista de usuarios permitidos */
      listaPermitidos: () => ListaPermitidos.para(salaId),

      /** Devuelve solo la data serializable (sin funciones) */
      raw: getFromDb,

      profe: (await getFromDb()).profe,
    }
  }

  //Obtiene la sala del profe si existe, o null si no tiene ninguna. */
  export async function obtener(socket: SocketProfe): Promise<Awaited<ReturnType<typeof get>> | null> {
    const idSala = await db.getIdSalaDeProfe(socket.data.session.email)
    if (!idSala) return null
    return get(idSala)
  }

  //Crea una sala nueva en memoria y la asigna a un profe */
  export async function crear(socket: SocketProfe, configExtra?: Partial<ConfigSala>) {
    const id = randomUUID().split('-')[0]
    const email = socket.data.session.email

    const config_default: ConfigSala = {
      metodo_login: MetodosLogin.Nombre,
      link: '',
      nombre_profe: email,
      solo_invitados: false,
    }

    const config = {
      nombre_profe: socket.data.session.nombre || email,
      ...(configExtra ?? socket.data.config_sala ?? {}),
    } as Partial<ConfigSala>

    const config_sala = mergeDeep(config_default, config) as ConfigSala

    const salaData = {
      id,
      profe: { email, nombre: config_sala.nombre_profe },
      config: { ...config_sala, link: `${process.env.NEXT_PUBLIC_HOST}/sala/${id}/` }, // Le agregamos el link en la config
    }

    // Guardamos en DB
    await db.guardarSala(salaData)
    await db.registrarProfe(email, id)

    console.log(`🏠 Creando sala ${id} en memoria para profe ${email}`)

    return await get(id)
  }

  export async function existe(salaId: string) {
    return db.existeSala(salaId)
  }

  export async function assertExiste(salaId: string) {
    // Verificamos que la sala exista
    if (!(await existe(salaId))) throw new ErrorSesion(TipoErrorSesion.SalaNoExiste, `La sala ${salaId} no existe.`)
  }

  /** Funciones de relaciones: */

  /** Devuelve la sala dado el email del profe */
  export async function getByEmailProfe(email: string) {
    const idSala = await db.getIdSalaDeProfe(email)
    if (!idSala) throw new Error(`El profe ${email} no tiene sala asignada!`)
    return get(idSala)
  }
}
