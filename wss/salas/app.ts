import { randomUUID } from "crypto"
import { Socket } from "socket.io"
import { Encuesta } from "../tipos"

interface Sala { 
  id: string
  polls: Map<string, Encuesta>
  votantes: Map<string, Set<string>> // pollId -> set de userIds que han votado
  votos: Map<string, Map<string, string>> // pollId -> (userId -> optionId)
}

/** Data de polls por sala */
export const salas = new Map<string, Sala>()

// Maps para relaciones
export const owners_salas = new Map<string, string>()
export const salas_owners = new Map<string, string>()
export const sockets_profes = new Map<string, Socket>()

/** Crea una sala nueva en memoria y la asigna a un profe */
export const crearSala = (email: string) => { 
  const id = randomUUID().split('-')[0]

  // Le creamos los buffers
  salas.set(id, {
    id,
    polls: new Map<string, Encuesta>(),
    votantes: new Map<string, Set<string>>(),
    votos: new Map<string, Map<string, string>>(),
  })

  // Registramos owners
  owners_salas.set(email, id)
  salas_owners.set(id, email)

  console.log(`🏠 Creando sala ${id} en memoria para profe ${email}`)

  return salas.get(id)!
}

/** Obtiene el ID de la sala del profe, _creandola si no existe_ */
export const getSalaId = (email: string) => {
  if (!owners_salas.has(email)) throw new Error(`El profe ${email} no tiene sala asignada!`)
  return owners_salas.get(email)!
}


export const getEmailProfeDeSala = (salaId: string) => {
  if (!salas_owners.has(salaId)) throw new Error(`Sala ${salaId} sin profe!`)
  return salas_owners.get(salaId)!
}


/**
 * Devuelve la data de polls, votantes y votos de la sala
 * @throws Error si la sala no existe
 */
export const getSalaById = (salaId: string) => {
  if (!salas.has(salaId)) {
    throw new Error(`La sala ${salaId} no existe`)
  }
  return salas.get(salaId)!
}

/** Devuelve la data de polls, votantes y votos de la sala del profe, dado su email */
export const getSalaByEmail = (email: string) => {
  const salaId = getSalaId(email)
  return getSalaById(salaId)
}


/** Devuelve los _sockets_ de todos los profes across de todas las salas (para broadcastear por ej.) */
export const getSocketsProfes = () => {
  return Array.from(sockets_profes.values())
}

/** Devuelve el socket de un profe por id de sala (el owner) */
export const getSocketProfeDeSala = (salaId: string) => {
  const email = getEmailProfeDeSala(salaId)
  return getSocketProfe(email)
}

/** Devuelve el socket de un profe por email */
export const getSocketProfe = (email: string) => {
  if (!sockets_profes.has(email)) throw new Error(`El profe ${email} no tiene socket registrado!`)
  return sockets_profes.get(email)!
}
