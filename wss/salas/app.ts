import { randomUUID } from 'crypto'
import { entries, groupBy, mergeDeep } from 'remeda'

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

    /** Limpia las que según la sala existen pero que no están en redis (fueron revocadas) */
    async function limpiarEstudiantesSinSesion() {
      const estudiantesData = await db.getEstudiantes(salaId)
      const userIdsState = Object.keys(estudiantesData)

      const socketsEstudiantesSala = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
      const userIdsSockets = socketsEstudiantesSala.map((s) => s.data.session.userId)

      // Esto es lista de estudiantes en DB vs sockets en el room... revisar.

      // Las inválidas son las que estén en estudiantesData pero no en sockets
      const invalidas = userIdsState.filter((id) => !userIdsSockets.includes(id))

      // Las limpiamos de redis
      if (invalidas.length > 0) {
        // Logueamos
        const emailProfe = await db.getEmailProfe(salaId)
        console.warn(`⚠️  Sesiones inválidas en sala ${salaId} de ${emailProfe}:`, invalidas, ` limpiando...`)

        // Invalidamos (las borramos de db y de la respuesta que vamos a dar)
        invalidas.forEach((sid) => {
          db.borrarEstudiante(salaId, sid) // de la lista de estudiantes de la sala
        })
      }

      // Las válidas las devolvemos
      return socketsEstudiantesSala.map((s) => s.data.session)
    }

    /** Devuelve la lista de estudiantes en la sala, limpiando previamente las sesiones revocadas. */
    async function listarEstudiantes() {
      await limpiarEstudiantesSinSesion()

      // Targeteamos a las sesiones attacheadas a los sockets (agrupadas por userId)
      const socketsConectados = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
      const socketsPorUsuario = groupBy(socketsConectados, (s) => s.data.session.userId)

      // Nos quedamos con la primera sesión (socket) de cada usuario
      const conectados = entries(socketsPorUsuario)
        .map(([_, sockets]) => ({
          ...sockets[0].data.session,
          conectado: true,
        }))
        .filter((s): s is WssEstudianteSession & { conectado: true } => s !== null)

      return conectados
    }

    /** Se ocupa de kickear a los estudiantes que queden fuera luego de un cambio de auth (lista de permitido) */
    async function sanitizar() {
      const sala = await getFromDb()

      // Solo aplica cuando la sala no autentica solo por nombre y restringe a la lista de invitados
      if (sala.config.esquema === MetodosLogin.Nombre || !sala.config.solo_invitados) return

      // Pasado este punto estamos verificando si el userId de cada socket de estudiante está autorizado en la lista de permitidos
      // (que a su vez se basa en el campo de identidad del esquema de la sala, que para DNI es el dni y para Google es el email)
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
            sala.config.esquema === MetodosLogin.DNI ? 'DNI' : 'email'
          } ya no está en la lista de participantes permitidos.`,
        })
        s.disconnect()
      })
    }

    /** Quita los inactivos de la lista de la sala -- @todo: EXCEPTO LOS QUE ESTÉN EN LA LISTA DE DNI/MAIL!*/
    async function limpiarEstudiantes() {
      const estudiantes = await db.getEstudiantes(salaId)
      const inactivos = Object.entries(estudiantes)
        .filter(([_, activo]) => activo === '0')
        .map(([id]) => id)
      if (inactivos.length > 0) await db.borrarEstudiantes(salaId, inactivos)
    }

    async function marcarEstudiantePresente(userId: string) {
      await db.marcarPresente(salaId, userId)
    }

    async function marcarEstudianteAusente(userId: string) {
      await db.marcarAusente(salaId, userId)
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

      /** Marca un estudiante como presente en la sala */
      marcarEstudiantePresente,

      /** Marca un estudiante como ausente en la sala */
      marcarEstudianteAusente,

      /** Valida lo que recibe y si pasa actualiza la config de la sala */
      actualizarConfig,

      /** Gestión de la lista de usuarios permitidos */
      listaPermitidos: () => ListaPermitidos.para(salaId),

      /** Devuelve solo la data serializable (sin funciones) */
      raw: getFromDb,

      profe: (await getFromDb()).profe,
    }
  }

  /** Obtiene una sala existente, y si no existe la crea y le asigna un namespace */
  export async function obtenerOCrear(socket: SocketProfe): Promise<ReturnType<typeof get>> {
    const email = socket.data.session.email

    // Averiguamos si ya tiene sala
    const owner = await db.getIdSalaDeProfe(email)

    // Si no tiene, le creamos una
    if (!owner) {
      const sala = await crear(socket)
      console.log(`✅ Sala creada para profe ${email}: ${sala.id}`)
    }

    // Recuperamos la sala
    return getByEmailProfe(email)
  }

  /** Crea una sala nueva en memoria y la asigna a un profe */
  export async function crear(socket: SocketProfe) {
    const id = randomUUID().split('-')[0]
    const email = socket.data.session.email

    const config_default: ConfigSala = {
      esquema: MetodosLogin.Nombre,
      link: '',
      nombre_profe: email,
      solo_invitados: false,
    }

    const config = {
      nombre_profe: socket.data.session.nombre || email,
      ...(socket.data.config_sala ?? {}),
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
