import { randomUUID } from 'crypto'
import { entries, groupBy, mergeDeep } from 'remeda'

import { RemoteSocket } from 'socket.io'
import db from '../db'
import { SocketProfe } from '../middleware/roles'
import { revocarUsuarios } from '../middleware/session'
import { io } from '../server'
import { RolEncuesta } from '../tipos'
import { configSala, ConfigSala } from '../validators/salas'
import { WssServerSession } from '../validators/session'

export interface SalaData {
  id: string
  profe: {
    email: string
    nombre?: string
  }
  config: ConfigSala
}

export const salaService = async (salaId: string) => {
  async function get() {
    const exists = await db.hexists('salas', salaId)
    if (!exists) {
      throw new Error(`La sala ${salaId} no existe`)
    }
    const salaDataStr = await db.hget('salas', salaId)
    return JSON.parse(salaDataStr!) as SalaData
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
    const estudiantesData = await db.hgetall(`sala:${salaId}:estudiantes`)
    const userIdsState = Object.keys(estudiantesData)

    const socketsEstudiantesSala = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
    const userIdsSockets = socketsEstudiantesSala.map((s) => s.data.session.userId)

    // Las inválidas son las que estén en estudiantesData pero no en sockets
    const invalidas = userIdsState.filter((id) => !userIdsSockets.includes(id))

    // Las limpiamos de redis
    if (invalidas.length > 0) {
      // Logueamos
      const emailProfe = await db.hget('salas_owners', salaId)
      console.warn(`⚠️  Sesiones inválidas en sala ${salaId} de ${emailProfe}:`, invalidas, ` limpiando...`)

      // Invalidamos (las borramos de db y de la respuesta que vamos a dar)
      invalidas.forEach((sid) => {
        db.hdel(`sala:${salaId}:estudiantes`, sid) // de la lista de estudiantes de la sala
      })
    }

    // Las válidas las devolvemos
    return socketsEstudiantesSala.map((s) => s.data.session)
  }

  /** Devuelve la lista de estudiantes en la sala, limpiando previamente las sesiones revocadas. */
  async function listarEstudiantes() {
    await limpiarEstudiantesSinSesion()

    const socketsConectados = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
    const socketsPorUsuario = groupBy(socketsConectados, (s) => s.data.session.userId)

    // Nos quedamos con la primera sesión (socket) de cada usuario
    const conectados = entries(socketsPorUsuario)
      .map(([_, sockets]) => (sockets.length ? sockets[0].data.session : null))
      .filter((s): s is WssServerSession => s !== null)

    return conectados
  }

  async function sanitizar() {
    const sala = await get()

    // Si pasamos a requerir dni, kickeamos a los estudiantes sin dni
    if (sala.config.pedir_dni) {
      // Colectamos
      const estudiantes = await listarEstudiantes()
      const sinDni = estudiantes.filter((e) => e.rol === RolEncuesta.Estudiante && !e.dni)

      console.log(`ESTUDIANTES AL MOMENTO DE SANITIZAR: `, estudiantes)

      // Si no hay ninguno, no hay nada más que hacer
      if (sinDni.length === 0) return

      // Chiflamos al log!
      console.warn(
        `⚠️  Estudiantes sin DNI en sala ${salaId} al activar pedir_dni:`,
        sinDni.map((e) => e.userId)
      )

      // Notificamos y desconectamos(kick)
      sinDni.forEach((e) => {
        // Los desconectamos enviándoles un mensaje de error a su sala
        const socks = io.in(`sala:${salaId}:${e.userId}`)
        socks.emit('sala:kick', {
          motivo: 'La sala ahora requiere DNI para conectarse. Por favor, volvé a conectarte :)',
        })
        socks.disconnectSockets()
      })

      // Los borramos de la lista de estudiantes de la sala
      await Promise.all(sinDni.map((e) => db.hdel(`sala:${salaId}:estudiantes`, e.userId)))

      // Revocamos sus sesiones -- pendiente discriminar por sala!
      await revocarUsuarios(sinDni.map((e) => e.sessionId))
    }
  }

  /** Quita los inactivos de la lista de la sala */
  async function limpiarEstudiantes() {
    const estudiantes = await db.hgetall(`sala:${salaId}:estudiantes`)

    const pipeline = db.pipeline()

    for (const [id, activo] of Object.entries(estudiantes)) {
      if (activo === '0') {
        pipeline.hdel(`sala:${salaId}:estudiantes`, id)
      }
    }

    await pipeline.exec()
  }

  async function marcarEstudiantePresente(userId: string) {
    await db.hset(`sala:${salaId}:estudiantes`, userId, '1')
  }

  async function marcarEstudianteAusente(userId: string) {
    await db.hset(`sala:${salaId}:estudiantes`, userId, '0')
  }

  async function actualizarConfig(payload: unknown) {
    const sala = await get()
    // Validamos
    const config = configSala.strict().partial().parse(payload)
    const configActual = sala.config
    const nuevaConfig = mergeDeep(configActual, config) as ConfigSala
    sala.config = nuevaConfig

    await db.hset('salas', sala.id, JSON.stringify(sala))
  }

  return {
    id: salaId,

    /** Devuelve la sala actualizada */
    get,

    /** Lleva a cabo las acciones necesarias para que el estado respete la config (e.g. kickear a los estudiantes que no tengan DNI cuando es pedido) */
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

    /** Devuelve solo la data serializable (sin funciones) */
    raw: get,

    profe: (await get()).profe,
  }
}

/** Obtiene una sala existente, y si no existe la crea y le asigna un namespace */
export async function obtenerOCrearSala(socket: SocketProfe): Promise<ReturnType<typeof salaService>> {
  const email = socket.data.session.email

  // Averiguamos si ya tiene sala
  const owner = await db.hget('owners_salas', email)

  // Si no tiene, le creamos una
  if (!owner) {
    const sala = await crearSala(socket)
    console.log(`✅ Sala creada para profe ${email}: ${sala.id}`)
  }

  // Recuperamos la sala
  return getSalaByEmailProfe(email)
}

/** Crea una sala nueva en memoria y la asigna a un profe */
export async function crearSala(socket: SocketProfe) {
  const id = randomUUID().split('-')[0]
  const email = socket.data.session.email

  // Todavía no está en uso
  const config_default: ConfigSala = {
    pedir_dni: false,
    permitir_anonimo: true,
    // invitados: [],
    nombre_profe: email,
  }

  const config = {
    nombre_profe: socket.data.session.nombre || email,
    ...(socket.data.config_sala ?? {}),
  } as Partial<ConfigSala>

  const config_sala = mergeDeep(config_default, config) as ConfigSala

  const salaData: SalaData = {
    id,
    profe: { email, nombre: config_sala.nombre_profe },
    config: config_sala,
  }

  // Guardamos en DB
  await db.hset('salas', id, JSON.stringify(salaData))
  await db.hset('owners_salas', email, id)
  await db.hset('salas_owners', id, email)

  console.log(`🏠 Creando sala ${id} en memoria para profe ${email}`)

  return salaService(id)
}

/**
 * Devuelve la data de polls, votantes y votos de la sala
 * @throws Error si la sala no existe
 */
export async function getSalaById(salaId: string) {
  const exists = await db.hexists('salas', salaId)
  if (!exists) throw new Error(`La sala ${salaId} no existe`)
  return salaService(salaId)
}

export async function existeSala(salaId: string) {
  return (await db.hexists('salas', salaId)) === 1
}

/** Funciones de relaciones: */

/** Obtiene el ID de la sala del profe, _creandola si no existe_ */
export async function getSalaId(email: string) {
  const idSala = await db.hget('owners_salas', email)
  if (!idSala) throw new Error(`El profe ${email} no tiene sala asignada!`)
  return idSala
}

/** Obtiene el email del profe dueño de la sala, dado el id de la sala */
export async function getEmailProfeDeSala(salaId: string) {
  const owner = await db.hget('salas_owners', salaId)
  if (!owner) throw new Error(`Sala ${salaId} sin profe!`)
  return owner
}

/** Devuelve la data de polls, votantes y votos de la sala del profe, dado su email */
export async function getSalaByEmailProfe(email: string) {
  const salaId = await getSalaId(email)
  return getSalaById(salaId)
}
