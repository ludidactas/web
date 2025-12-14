import { randomUUID } from "crypto"
import { capitalize, first, mergeDeep, shuffle } from "remeda"

import db from "../db"
import { io, registrarSalaEnServer } from "../server"
import { getSession, SocketConSesion } from "../middleware/session"
import { SocketProfe } from "../middleware/roles"

export interface ConfigSala {
  pedir_dni: boolean
  permitir_anonimo: boolean
  // invitados: string[] // emails permitidos a entrar
  nombre_profe: string
}

export interface SalaData {
  id: string
  profe: {
    email: string
    nombre?: string
  }
  config: ConfigSala
}

// Map email_profe: socket
export const sockets_profes = new Map<string, SocketProfe>()

export const conHandlers = (sala: SalaData) => ({
  ...sala,

  /** Borra los estudiantes desconectados de la lista */
  limpiarEstudiantes: async () => {
    const estudiantes = await db.hgetall(`sala:${sala.id}:estudiantes`)

    const pipeline = db.pipeline()

    for (const [sessionId, activo] of Object.entries(estudiantes)) {
      if (activo === '0') {
        pipeline.hdel(`sala:${sala.id}:estudiantes`, sessionId)
      }
    }

    await pipeline.exec()
  },

  /** Devuelve la lista de estudiantes, y anota si están presentes */
  listarEstudiantes: async () => {
    const estudiantesData = await db.hgetall(`sala:${sala.id}:estudiantes`)
    const sesionesIds = Object.keys(estudiantesData)

    const invalidas = sesionesIds.filter(sid => !getSession(sid))
    if (invalidas.length > 0) {
      const emailProfe = await db.hget('salas_owners', sala.id)
      console.warn(`⚠️  Sesiones inválidas en sala ${sala.id} de ${emailProfe}:`, invalidas, ` limpiando...`)
      invalidas.forEach(sid => {
        db.hdel(`sala:${sala.id}:estudiantes`, sid)
        delete estudiantesData[sid]
      })
    }

    return sesionesIds
      .map(sid => {
        const session = getSession(sid)
        return session ? {
          ...session,
          conectado: estudiantesData[sid] === '1'
        } : null
      })
      .filter(Boolean)
  },

  /** Envía a admin, profe y estudiantes de la sala */
  broadcast: async (event: string, data: unknown, mapper: (data: unknown, socket: SocketConSesion) => Promise<any> = async data => data) => {

    const sock_profe = sockets_profes.get(sala.profe.email)
    if (!sock_profe) throw new Error(`Profe ${sala.profe.email} no tiene socket!`)
    
    console.log(`📡 Broadcasteando evento '${event}' en sala ${sala.id}`)

    await Promise.all([
      // A los admins
      ...io.of('/sala/admin').sockets.values()
        .map(async s => s.emit(event, await mapper(data, s))),
      // Al profe
      sock_profe.emit(event, await mapper(data, sock_profe)),
      // A los estudiantes
      ...io.of(`/sala/${sala.id}/estudiante`).sockets.values()
        .map(async s => s.emit(event, await mapper(data, s))),
    ])
  },

  /** Devuelve el socket del profe */
  socketProfe: () => {
    const sock = sockets_profes.get(sala.profe.email)
    if (!sock) throw new Error(`Socket de profe ${sala.profe.email} no encontrado! D:`)
    return sock
  },

  /** Marca un estudiante como presente en la sala */
  marcarEstudiantePresente: async (sessionId: string) => {
    await db.hset(`sala:${sala.id}:estudiantes`, sessionId, '1')
  },

  /** Marca un estudiante como ausente en la sala */
  marcarEstudianteAusente: async (sessionId: string) => {
    await db.hset(`sala:${sala.id}:estudiantes`, sessionId, '0')
  },

  /** Devuelve solo la data serializable (sin funciones) */
  raw: () => sala,
})

/** Obtiene una sala existente, y si no existe la crea y le asigna un namespace */
export async function obtenerOCrearSala(socket: SocketProfe): Promise<ReturnType<typeof conHandlers>> {
  const email = socket.data.user.email

  // Registramos que el profe nos está hablando desde este socket:
  sockets_profes.set(email, socket)

  // Averiguamos si ya tiene sala
  const owner = await db.hget('owners_salas', email)

  // Si no tiene, le creamos una
  if (!owner) {
    const sala = await crearSala(socket)
    registrarSalaEnServer(sala.id)
    console.log(`✅ Sala creada para profe ${email}: ${sala.id}`)
  }

  // Recuperamos la sala
  return getSalaByEmailProfe(email)
}

/** Crea una sala nueva en memoria y la asigna a un profe */
export async function crearSala(socket: SocketProfe) {
  const id = randomUUID().split('-')[0]
  const email = socket.data.user.email

  // Todavía no está en uso
  const config_default: ConfigSala = {
    pedir_dni: false,
    permitir_anonimo: true,
    // invitados: [],
    nombre_profe: email
  }

  const config = {
    nombre_profe: socket.data.user.nombre || email,
    ...socket.data.config_sala ?? {}
  } as Partial<ConfigSala>


  const config_sala = mergeDeep(config_default, config) as ConfigSala

  // Le creamos los buffers
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

  return conHandlers(salaData)
}

/**
 * Devuelve la data de polls, votantes y votos de la sala
 * @throws Error si la sala no existe
 */
export async function getSalaById(salaId: string) {
  const exists = await db.hexists('salas', salaId)
  if (!exists) {
    throw new Error(`La sala ${salaId} no existe`)
  }
  const salaDataStr = await db.hget('salas', salaId)
  return conHandlers(JSON.parse(salaDataStr!) as SalaData)
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

/** Devuelve el socket de un profe por id de sala (el owner) */
export async function getSocketProfeDeSala (salaId: string) {
  return (await getSalaById(salaId)).socketProfe()
}


// Generador de nombres de fantasía

const nombres = [
  'Burbujito', 'Pompón', 'Chispitas', 'Bolitas', 'Pelotín', 'Globito', 'Saltarín',
  'Zigzag', 'Tintín', 'Pimpón', 'Bambú', 'Coco', 'Kiwi', 'Mango', 'Pera',
  'Tofú', 'Sushi', 'Wasabi', 'Matcha', 'Oreo', 'Dorito', 'Nacho', 'Taco',
  'Pixel', 'Emoji', 'WiFi', 'Oveja', 'Androide', 'Avatar', 'Bit', 'Byte',
  'Neo', 'Zeta', 'Alfa', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma',
  'Turbo', 'Nitro', 'Flash', 'Sonic', 'Dash', 'Rush', 'Voltio', 'Chispa',
  'Cosmo', 'Astro', 'Estelar', 'Nova', 'Quasar', 'Cohete', 'Cometa'
];

const apellidos = [
  'Saltamontes', 'Mariposa', 'Libélula', 'Colibrí', 'Caracol', 'Lombriz', 'Oruga',
  'Pompaburbuja', 'Remolino', 'Torbellino', 'Huracán', 'Tornado', 'Ciclón', 'Vendaval',
  'Arcoíris', 'Destello', 'Centelleo', 'Parpadeo', 'Guiño', 'Pestañeo', 'Titileo',
  'Rebote', 'Zigzagueo', 'Espiral', 'Voltereta', 'Pirueta', 'Mareo', 'Vértigo',
  'Cosquillas', 'Carcajada', 'Risita', 'Sonrisa', 'Mueca', 'Guiño', 'Abrazo',
  'Saltatrampas', 'Rompenubes', 'Cazaestrellas', 'Persueño', 'Atrapaluna', 'Robasonrisa',
  'Comecocos', 'Bebesoda', 'Masticanubes', 'Tragaluces', 'Absorbebrisa', 'Soplafuego',
  'Electrochoque', 'Megavoltio', 'Gigarayo', 'Teravatio', 'Nanómetro',
  'Supersónico', 'Hiperbólico', 'Parabólico', 'Geométrico', 'Algebraico', 'Trigonométrico',
  'Galáctico', 'Intergaláctico', 'Multiversal', 'Dimensional', 'Cuántico', 'Holográfico'
];

export function nombreDeFantasia() {
  const nombre = capitalize(first(shuffle(nombres))!)
  const apellido = capitalize(first(shuffle(apellidos))!)
  return `${nombre} ${apellido}`;
}