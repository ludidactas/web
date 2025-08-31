import { merge } from "remeda"
import { z } from "zod"
import { getSalaByEmail, getSalaById } from "../salas/app"
import { Encuesta, EncuestaHidratada } from "../tipos"
import { extractZodErrorMessages } from "../utils"
import { pollBase, voteValidator } from "../validators"



/** Crea un closure para operar los componentes de una sala */
export function profeSala(email: string){ 

  const { id: salaId, votos, votantes, polls } = getSalaByEmail(email)
  
  // Acciones de profe: 

  function listar() { 
    return Array.from(polls.values())
  }

  function crearPoll(pollDataUnknown: unknown){

    console.log(`Request de creación de `, pollDataUnknown)

    // Parseamos con el validator
    assertValidPoll(pollDataUnknown)
    const pollData = pollBase.parse(pollDataUnknown)

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

  function consultarVotantes({ pollId }: { pollId: string }) {
    assertPollExists(salaId, pollId)

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

  function updatePoll(pollId: string, update: Partial<Encuesta>){

    assertPollExists(salaId, pollId)
    const poll = polls.get(pollId)!

    // Dependiendo de qué se actualice, validamos:
    if (update.isOpen === true) assertPollIsClosed(poll)
    if (update.isOpen === false) assertPollIsOpen(poll)
    if (update.isPublished === true) assertPollIsHidden(poll)
    if (update.isPublished === false) assertPollIsPublished(poll)

    const nueva = merge(poll, update) as Encuesta
    polls.set(pollId, nueva)
    console.log(`Encuesta updateada: ${poll.pregunta}`)

    return nueva
  }

  function deletePoll({ pollId }: { pollId: string }){

    // Validamos
    assertPollExists(salaId, pollId)

    if (polls.has(pollId)) {
      polls.delete(pollId)
      votantes.delete(pollId)
      console.log(`Encuesta borrada: ${pollId}`)
    }
  }

  function consultarResultados(pollId: string) {
    const poll = polls.get(pollId)
    if (!poll) throw new Error('Encuesta no encontrada')
    return poll
  }
  
  return {
    listar,
    consultarResultados,
    consultarVotantes,
    crearPoll,
    updatePoll,
    deletePoll,
  }
}


export function estudianteSala(idSala: string, sessionId: string) { 
  const { votos, votantes, polls } = getSalaById(idSala)

  // Acciones de estudiante:

  function assertElEstudianteNoVotoTodavia(poll: Encuesta, user: string) {
    const votantesRegistrados = votantes.get(poll.id)
    if (!votantesRegistrados) throw new Error('Encuesta no encontrada o no tiene votantes registrados')
    if (votantesRegistrados.has(user)) throw new Error('Ya votaste en esta encuesta')
  }

  function votar(voteData: z.infer<typeof voteValidator>) {
    const { pollId, optionId } = voteData

    assertPollExists(idSala, pollId)

    const poll = polls.get(pollId)!
    const personasQueYaVotaron = votantes.get(pollId)
    const votosEmitidos = votos.get(pollId)

    // Validamos
    assertPollIsOpen(poll)
    assertElEstudianteNoVotoTodavia(poll, sessionId)

    // Guardamos el voto
    const opc = poll.opciones.find(opcion => opcion.id === optionId)

    // Validaciones 
    if (!opc) throw new Error('Opción inválida')
    if (!personasQueYaVotaron) throw new Error('Buffer de votantes no encontrado')
    if (!votosEmitidos) throw new Error('Buffer de votos no encontrado')

    // Registramos el voto
    poll.opciones[poll.opciones.indexOf(opc)].votos++
    personasQueYaVotaron.add(sessionId)
    votosEmitidos.set(sessionId, optionId)

    return poll
  }

  function listar() {
    return hidratadas(idSala, sessionId)
  }

  return {
    listar,
    votar,
  }
}


/** Hidrata una encuesta con la info del estudiante (si ya votó y qué opción) */
export function hidratar(salaId: string, poll: Encuesta, sessionId: string): EncuestaHidratada {

  const { votos } = getSalaById(salaId)

  const votosPoll = votos.get(poll.id)

  if (!votosPoll) throw new Error(`Encuesta no encontrada o no tiene votantes registrados (hidratando ${poll.id} para uid ${sessionId})`)
  
  return {
    ...poll,
    puedoVotar: !votosPoll.has(sessionId),
    votoEmitido: votosPoll.has(sessionId) ? votosPoll.get(sessionId) : undefined
  }
}


/** Devuelve la lista de encuestas publicadas hidratadas para un user  */
export function hidratadas(salaId: string, sessionId: string) {
  const { polls } = getSalaById(salaId)
  return Array.from(polls.values()).filter(e => e.isPublished).map(poll => hidratar(salaId, poll, sessionId))
} 


// Assertions para validar los eventos

export function assertValidPoll(pollData: unknown) {
  const { error } = pollBase.safeParse(pollData)
  if (error) throw new Error(`Encuesta inválida: ${extractZodErrorMessages(error)}`)
}


function assertPollExists(idSala: string, idPoll: string) {
  const { polls } = getSalaById(idSala)
  if (!polls.has(idPoll)) throw new Error('La encuesta no existe!')
}

function assertPollIsOpen(poll: Encuesta) {
  if (!poll.isOpen) throw new Error('La encuesta ya cerró!')
}

function assertPollIsClosed(poll: Encuesta) {
  if (poll.isOpen) throw new Error('La encuesta ya está abierta!!')
}

function assertPollIsPublished(poll: Encuesta) {
  if (!poll.isPublished) throw new Error('La encuesta no está publicada!')
}

function assertPollIsHidden(poll: Encuesta) {
  if (poll.isPublished) throw new Error('La encuesta ya está oculta!')
}