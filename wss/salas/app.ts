import { randomUUID } from 'crypto'
import { entries, groupBy, mergeDeep } from 'remeda'

import { RemoteSocket } from 'socket.io'
import db from '../db'
import { SocketProfe } from '../middleware/roles'
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

export namespace Salas {
  export async function get(salaId: string) {
    async function getFromDb() {
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
        .map(([_, sockets]) => ({
          ...sockets[0].data.session,
          conectado: true,
        }))
        .filter((s): s is WssServerSession => s !== null)

      return conectados
    }

    async function sanitizar() {
      const sala = await getFromDb()

      // Si pasamos a requerir dni, kickeamos a los estudiantes sin dni
      if (sala.config.pedir_dni) {
        // Colectamos
        const sockets = await io.in(`sala:${salaId}:estudiantes`).fetchSockets()
        const sinDni = sockets.filter((s) => s.data.session.rol === RolEncuesta.Estudiante && !s.data.session.dni)

        // Si no hay ninguno, no hay nada más que hacer
        if (sinDni.length === 0) return

        // Chiflamos al log!
        console.warn(
          `⚠️  Estudiantes sin DNI en sala ${salaId} al activar pedir_dni:`,
          sinDni.map((s) => s.data.session.userId)
        )

        // Notificamos y desconectamos(kick)
        sinDni.forEach((s) => {
          // Los desconectamos enviándoles un mensaje de error a su sala
          s.emit('sala:kick', {
            motivo: 'La sala ahora requiere DNI para conectarse. Por favor, volvé a conectarte :)',
          })
          s.disconnect()
        })

        /** @todo: Marcar el drop para la lista de presentes */
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
      const sala = await getFromDb()
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
      get: getFromDb,

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
      raw: getFromDb,

      profe: (await getFromDb()).profe,
    }
  }

  /** Obtiene una sala existente, y si no existe la crea y le asigna un namespace */
  export async function obtenerOCrear(socket: SocketProfe): Promise<ReturnType<typeof get>> {
    const email = socket.data.session.email

    // Averiguamos si ya tiene sala
    const owner = await db.hget('owners_salas', email)

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

    return get(id)
  }

  export async function existe(salaId: string) {
    return (await db.hexists('salas', salaId)) === 1
  }

  /** Funciones de relaciones: */

  /** Devuelve la sala dado el email del profe */
  export async function getByEmailProfe(email: string) {
    const idSala = await db.hget('owners_salas', email)
    if (!idSala) throw new Error(`El profe ${email} no tiene sala asignada!`)
    return get(idSala)
  }
}
