import { randomUUID } from "crypto"
import { capitalize, first, mergeDeep, shuffle } from "remeda"

import { io, registrarSalaEnServer } from "../server"
import { getSession, SocketConSesion, SocketProfe } from "../session"
import { Encuesta } from "../tipos"

export interface ConfigSala { 
  pedir_dni: boolean
  permitir_anonimo: boolean
  invitados: string[] // emails permitidos a entrar
  nombre_profe: string
}

export interface Sala { 
  id: string
  profe: {
    email: string
    nombre?: string
  }
  polls: Map<string, Encuesta>
  votantes: Map<string, Set<string>> // pollId -> set de userIds que han votado
  votos: Map<string, Map<string, string>> // pollId -> (userId -> optionId)
  estudiantes: Map<string, boolean> // sessionId -> presente?
  config: ConfigSala
}

/** Data de polls por sala */
export const salas = new Map<string, Sala>()

// Maps para relaciones
export const owners_salas = new Map<string, string>()
export const salas_owners = new Map<string, string>()

// Map email_profe: socket
export const sockets_profes = new Map<string, SocketProfe>()

export const conHandlers = (sala: Sala) => ({
  ...sala,
  limpiarEstudiantes: () => {
    sala.estudiantes.forEach((activo, id) => {
      if (!activo) sala.estudiantes.delete(id)
    })
  },
  listarEstudiantes: () => {
    const sesionesIds = Array.from(sala.estudiantes.keys())
    const invalidas = sesionesIds.filter(sid => !getSession(sid))
    if (invalidas.length > 0) {
      console.warn(`⚠️  Sesiones inválidas en sala ${sala.id} de ${sala.profe.email}: `, invalidas)
    }
    const estudiantes = sesionesIds.map(getSession).map(s => s ? ({ ...s, conectado: sala.estudiantes.get(s.sessionId) }) : s)
    return estudiantes
  },
  /** Envía a admin, profe y estudiantes de la sala */
  broadcast: (event: string, data: unknown, mapper: (data: unknown, socket: SocketConSesion) => any = data => data) => {
    io.of('/sala/admin').sockets.forEach(s => { s.emit(event, mapper(data, s)) })

    // Informamos al profe
    const sock_profe = sockets_profes.get(sala.profe.email)
    if(!sock_profe) throw new Error(`Profe ${sala.profe.email} no tiene socket!`) 
    sock_profe.emit(event, mapper(data, sock_profe))

    io.of(`/sala/${sala.id}/estudiante`).sockets.forEach(
      (socketEstudiante) => { socketEstudiante.emit(event, mapper(data, socketEstudiante)) })
  },
  socketProfe: () => {
    const sock = sockets_profes.get(sala.profe.email)
    if (!sock) throw new Error(`Socket de profe ${sala.profe.email} no encontrado! D:`)
    return sock
  },
  /** Devuelve solo la data serializable (sin funciones) */
  raw: () => sala
})

/** Obtiene una sala existente, y si no existe la crea y le asigna un namespace */
export const obtenerOCrearSala = (socket: SocketProfe): ReturnType<typeof conHandlers> => {
  const email = socket.data.user.email

  // Registramos que el profe nos está hablando desde este socket:
  sockets_profes.set(email, socket)

  if (!owners_salas.has(email)) {
    const sala = crearSala(socket)
    registrarSalaEnServer(sala.id)
    console.log(`✅ Sala creada para profe ${email}: ${sala.id}`)
  }
  return getSalaByEmailProfe(email)
}

/** Crea una sala nueva en memoria y la asigna a un profe */
export const crearSala = (socket: SocketProfe) => { 
  const id = randomUUID().split('-')[0]

  const email = socket.data.user.email

  const config = {
    nombre_profe: socket.data.user.nombre || email,
    ...socket.data.config_sala ?? {}
  } as Partial<ConfigSala>

  const config_default: ConfigSala = {
    pedir_dni: false,
    permitir_anonimo: true,
    invitados: [],
    nombre_profe: email
  }

  const config_sala = mergeDeep(config_default, config) as ConfigSala

  // Le creamos los buffers
  salas.set(id, {
    id,
    profe: { email, nombre: config_sala.nombre_profe },
    polls: new Map<string, Encuesta>(),
    votantes: new Map<string, Set<string>>(),
    votos: new Map<string, Map<string, string>>(),
    estudiantes: new Map<string, boolean>(),
    config: config_sala,
  })

  // Registramos owners
  owners_salas.set(email, id)
  salas_owners.set(id, email)

  console.log(`🏠 Creando sala ${id} en memoria para profe ${email}`)

  return conHandlers(salas.get(id)!)
}

/**
 * Devuelve la data de polls, votantes y votos de la sala
 * @throws Error si la sala no existe
 */
export const getSalaById = (salaId: string) => {
  if (!salas.has(salaId)) {
    throw new Error(`La sala ${salaId} no existe`)
  }
  return conHandlers(salas.get(salaId)!)
}


/** Funciones de relaciones: */

/** Obtiene el ID de la sala del profe, _creandola si no existe_ */
export const getSalaId = (email: string) => {
  if (!owners_salas.has(email)) throw new Error(`El profe ${email} no tiene sala asignada!`)
  return owners_salas.get(email)!
}

/** Obtiene el email del profe dueño de la sala, dado el id de la sala */
export const getEmailProfeDeSala = (salaId: string) => {
  if (!salas_owners.has(salaId)) throw new Error(`Sala ${salaId} sin profe!`)
  return salas_owners.get(salaId)!
}

/** Devuelve la data de polls, votantes y votos de la sala del profe, dado su email */
export const getSalaByEmailProfe = (email: string) => {
  const salaId = getSalaId(email)
  return getSalaById(salaId)
}

/** Devuelve el socket de un profe por id de sala (el owner) */
export const getSocketProfeDeSala = (salaId: string) => {
  return getSalaById(salaId).socketProfe
}

export const getEstudiantesEnSala = (salaId: string) => {
  return Array.from(getSalaById(salaId).estudiantes.entries()).map(([id, conectado]) => ({ ...getSession(id), conectado }))
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