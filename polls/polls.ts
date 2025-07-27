import { z } from "zod"
import { Encuesta, EncuestaHidratada } from "./encuestas"
import { extractZodErrorMessages } from "./utils"
import { pollBase, pollCreator, voteValidator } from "./validators"
import { merge } from "remeda"

// Polls y votos activos
export const polls = new Map<string, Encuesta>()
export const votantes = new Map<string, Set<string>>()
export const votos = new Map<string, Map<string, string>>()

/** Hidrata una encuesta con la info del cliente */
export const hidratar = (poll: Encuesta, uid: string): EncuestaHidratada => {
  const votosPoll = votos.get(poll.id)
  if (!votosPoll) throw new Error(`Encuesta no encontrada o no tiene votantes registrados (hidratando ${poll.id} para uid ${uid})`)
  return {
    ...poll,
    puedoVotar: !votosPoll.has(uid),
    votoEmitido: votosPoll.has(uid) ? votosPoll.get(uid) : undefined
  }
}

/** Devuelve la lista de encuestas activas hidratadas para un user  */
export const hidratadas = (uid: string) => Array.from(polls.values()).map(poll => hidratar(poll, uid))

// Assertions para validar los eventos

export function assertValidPoll(pollData: unknown) {
  const { error } = pollBase.safeParse(pollData)
  if (error) throw new Error(`Encuesta inválida: ${extractZodErrorMessages(error)}`)
}

export function assertPollExists(pollId: string) {
  if (!polls.has(pollId)) throw new Error('La encuesta no existe!')
}

export function assertPollIsOpen(poll: Encuesta) {
  if (!poll.isOpen) throw new Error('La encuesta ya cerró!')
}

export function assertPollIsClosed(poll: Encuesta) {
  if (poll.isOpen) throw new Error('La encuesta ya está abierta!!')
}

export function assertElUsuarioNoVotoTodavia(poll: Encuesta, user: string) {
  const votantesRegistrados = votantes.get(poll.id)
  if (!votantesRegistrados) throw new Error('Encuesta no encontrada o no tiene votantes registrados')
  if (votantesRegistrados.has(user)) throw new Error('Ya votaste en esta encuesta')
}

export function assertPollIsPublished(poll: Encuesta) {
  if (!poll.isPublished) throw new Error('La encuesta no está publicada!')
}

export function assertPollIsHidden(poll: Encuesta) {
  if (poll.isPublished) throw new Error('La encuesta ya está oculta!')
}

// Acciones de admin: 

export const crearPoll = (pollDataUnknown: unknown) => {

  console.log(`Request de creación de `, pollDataUnknown)

  // Parseamos con el validator
  assertValidPoll(pollDataUnknown)
  const pollData = pollCreator.parse(pollDataUnknown)

  // La creamos
  const poll: Encuesta = {
    id: Date.now().toString(),
    pregunta: pollData.pregunta,
    opciones: pollData.opciones.map((opc, i) => ({ id: i.toString(), texto: opc, votos: 0 })),
    createdAt: new Date().toISOString(),
    isOpen: true,
    isPublished: false,
  }

  // La agregamos a los polls activos y creamos el tracker de quién ya voto y qué
  polls.set(poll.id, poll)
  votantes.set(poll.id, new Set())
  votos.set(poll.id, new Map())

  console.log(`Encuesta creada: ${poll.pregunta}`)

  return poll
}

export const consultarVotantes = ({ pollId }: { pollId: string }) => {
  assertPollExists(pollId)

  const poll = polls.get(pollId)!
  const votantesSet = votantes.get(pollId)!
  const votosMap = votos.get(pollId)!

  if (poll && votantesSet) {
    const votantesList = Array.from(votantesSet).map(user => ({
      userId: user,
      voto: votosMap.get(user)
    }))
    return votantesList
  }
}

export const updatePoll = (pollId: string, update: Partial<Encuesta>) => {

  assertPollExists(pollId)
  const poll = polls.get(pollId)!

  // Dependiendo de qué se actualice, validamos:
  if (update.isOpen === true) assertPollIsClosed(poll)
  if (update.isOpen === false) assertPollIsOpen(poll)
  if (update.isPublished === true) assertPollIsHidden(poll)
  if (update.isPublished === false) assertPollIsPublished(poll)

  const nueva = merge(poll, update) as Encuesta
  polls.set(pollId, nueva)
  console.log(`Encuesta updateada: ${poll.pregunta}`)
  // console.log(`(Update:`, update, `)`)

  return nueva
}

export const deletePoll = ({ pollId }: { pollId: string }) => {

  // Validamos
  assertPollExists(pollId)

  if (polls.has(pollId)) {
    polls.delete(pollId)
    votantes.delete(pollId)
    console.log(`Encuesta borrada: ${pollId}`)
  }
}

// Acciones de estudiante:

export const votarUser = (uid: string) => (voteData: z.infer<typeof voteValidator>) => {
  const { pollId, optionId } = voteData

  assertPollExists(pollId)

  const poll = polls.get(pollId)!
  const personasQueYaVotaron = votantes.get(pollId)
  const votosEmitidos = votos.get(pollId)

  // Validamos
  assertPollIsOpen(poll)
  assertElUsuarioNoVotoTodavia(poll, uid) // Cambiar a socket.handshake.ip?

  // Guardamos el voto
  const opc = poll.opciones.find(opcion => opcion.id === optionId)

  // Validaciones 
  if (!opc) throw new Error('Opción inválida')
  if (!personasQueYaVotaron) throw new Error('Buffer de votantes no encontrado')
  if (!votosEmitidos) throw new Error('Buffer de votos no encontrado')

  // Registramos el voto
  poll.opciones[poll.opciones.indexOf(opc)].votos++
  personasQueYaVotaron.add(uid)
  votosEmitidos.set(uid, optionId)

  return poll
}

export const consultarResultados = (pollId: string) => {
  const poll = polls.get(pollId)
  if (!poll) throw new Error('Encuesta no encontrada')
  return poll
}