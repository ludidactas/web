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
export const hidratar = (poll: Encuesta, uid: string): EncuestaHidratada => ({
  ...poll,
  puedoVotar: !votantes.get(poll.id).has(uid),
  votoEmitido: votantes.get(poll.id).has(uid) ? votos.get(poll.id).get(uid) : undefined
})

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
  if (votantes.get(poll.id).has(user)) throw new Error('Ya votaste en esta encuesta')
}

export function assertPollIsPublished(poll: Encuesta) {
  if (!poll.isPublished) throw new Error('La encuesta no está publicada!')
}

export function assertPollIsHidden(poll: Encuesta) {
  if (poll.isPublished) throw new Error('La encuesta ya está oculta!')
}

// Acciones de admin: 

export const crearPoll = (pollData: z.infer<typeof pollCreator>) => {

  console.log(`Request de creación de `, pollData)

  assertValidPoll(pollData)

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
}

export const consultarVotantes = ({ pollId }: { pollId: string }) => {
  assertPollExists(pollId)

  const poll = polls.get(pollId)
  const votantesSet = votantes.get(pollId)

  if (poll && votantesSet) {
    const votantesList = Array.from(votantesSet).map(user => ({
      userId: user,
      voto: votos.get(pollId).get(user)
    }))
    return votantesList
  }
}

export const updatePoll = (pollId: string, update: Partial<Encuesta>) => {
  assertPollExists(pollId)

  const poll = polls.get(pollId)

  // Dependiendo de qué se actualice, validamos:
  if (update.isOpen === true) assertPollIsClosed(poll)
  if (update.isOpen === false) assertPollIsOpen(poll)
  if (update.isPublished === true) assertPollIsHidden(poll)
  if (update.isPublished === false) assertPollIsPublished(poll)

  polls.set(pollId, merge(poll, update) as Encuesta)
  console.log(`Encuesta updateada: ${poll.pregunta}`)
  // console.log(`(Updatea: ${update}`)

  return poll
}

export const deletePoll = ({ pollId }: { pollId: string }) => {

  // Validamos
  assertPollExists(pollId)

  if (polls.has(pollId)) {
    polls.delete(pollId)
    votantes.delete(pollId)
    console.log(`Poll deleted: ${pollId}`)
  }
}

// Acciones de estudiante:

export const votar = (uid: string) => (voteData: z.infer<typeof voteValidator>) => {
    const { pollId, optionId } = voteData

    const poll = polls.get(pollId)
    const personasQueYaVotaron = votantes.get(pollId)
    const votosEmitidos = votos.get(pollId)

    // Validamos
    assertPollExists(pollId)
    assertPollIsOpen(poll)
    assertElUsuarioNoVotoTodavia(poll, uid) // Cambiar a socket.handshake.ip?

    // Guardamos el voto
    poll.opciones[optionId].votos++
    personasQueYaVotaron.add(uid)
    votosEmitidos.set(uid, optionId)

    console.log(`Voto grabado: Encuesta ${pollId}, opción ${optionId}`)
  
    return poll
}
  
export const consultarResultados = (pollId: string) => {
  const poll = polls.get(pollId)
  if (!poll) throw new Error('Encuesta no encontrada')
  return poll
}