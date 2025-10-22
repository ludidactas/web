import { merge } from "remeda"
import { z } from "zod"
import { conHandlers, getSalaByEmailProfe, getSalaById } from "../salas/app"
import { Encuesta, EncuestaHidratada, RolEncuesta } from "../tipos"
import { extractZodErrorMessages } from "../utils"
import { pollBase, voteValidator } from "../validators"
import { assert } from "console"



/** Crea un closure para operar los componentes de una sala */
export function profeSala(email: string){ 

  const { id: salaId, votos, votantes, polls } = getSalaByEmailProfe(email)
  
  // Acciones de profe: 

  function listarEncuestas() { 
    return Array.from(polls.values())
  }

  function crearPoll(pollDataUnknown: unknown){

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
      isFocused: false,
      isRevealed: false,
      admiteAportes: pollData.admiteAportes,
    }

    // La agregamos a los polls activos y creamos el tracker de quién ya voto y qué
    polls.set(poll.id, poll)
    votantes.set(poll.id, new Set())
    votos.set(poll.id, new Map())

    console.log(`➕ Encuesta creada: ${poll.pregunta}`)

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
    if (update.isFocused === true) assertPollIsUnfocused(poll)
    if (update.isRevealed === true) assertPollIsNotRevealed(poll)
    if (update.isRevealed === false) assertPollIsRevealed(poll)

    const nueva = merge(poll, update) as Encuesta
    polls.set(pollId, nueva)
    console.log(`🔔 Encuesta ${poll.id} updateada:`, JSON.stringify(update))

    return nueva
  }

  function deletePoll({ pollId }: { pollId: string }){

    // Validamos
    assertPollExists(salaId, pollId)

    if (polls.has(pollId)) {
      polls.delete(pollId)
      votantes.delete(pollId)
      console.log(`🗑️  Encuesta borrada: ${pollId}`)
    }
  }

  function consultarResultados(pollId: string) {
    const poll = polls.get(pollId)
    if (!poll) throw new Error('Encuesta no encontrada')
    return poll
  }
  
  return {
    listarEncuestas,
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
    const { pollId, optionId, aporte } = voteData

    assertPollExists(idSala, pollId)

    const poll = polls.get(pollId)!
    const personasQueYaVotaron = votantes.get(pollId)
    const votosEmitidos = votos.get(pollId)

    // Validamos
    assertPollIsOpen(poll)
    assertElEstudianteNoVotoTodavia(poll, sessionId)
    if (aporte) assert(poll.admiteAportes, 'Esta encuesta no admite aportes')

    // Guardamos el voto
    if (aporte) {
      poll.opciones.push({ id: Date.now().toString(), texto: aporte, votos: 1 })
    } else {
      const opc = poll.opciones.find(opcion => opcion.id === optionId)
      if (!opc) throw new Error('Opción inválida')
      poll.opciones[poll.opciones.indexOf(opc)].votos++
    }

    // Validaciones de typechecking - nunca van a fallar mepa
    if (!personasQueYaVotaron) throw new Error('Buffer de votantes no encontrado')
    if (!votosEmitidos) throw new Error('Buffer de votos no encontrado')

    // Registramos el voto
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

/** Envía a admin, profe y a estudiantes una poll pero hidratada para cada quien  */
export function broadcastPoll(sala: ReturnType<typeof conHandlers>, poll: Encuesta) { 
  sala.broadcast('poll:updated', poll, (poll, socket) => { 
    if (socket.data.session.rol === RolEncuesta.Estudiante) {
      return hidratar(sala, poll as Encuesta, socket.data.session.sessionId)
    }
    return poll
  })
}


/** Hidrata una encuesta con la info del estudiante (si ya votó y qué opción) */
export function hidratar(sala: ReturnType<typeof conHandlers>, poll: Encuesta, sessionId: string): EncuestaHidratada {

  const { votos } = sala

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
  const sala = getSalaById(salaId)
  return Array.from(sala.polls.values()).filter(e => e.isPublished).map(poll => hidratar(sala, poll, sessionId))
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

function assertPollIsUnfocused(poll: Encuesta) {
  if (poll.isFocused) throw new Error('La encuesta ya está focuseada!')
}

function assertPollIsNotRevealed(poll: Encuesta) {
  if (poll.isRevealed) throw new Error('La encuesta ya está revelada!')
}

function assertPollIsRevealed(poll: Encuesta) {
  if (!poll.isRevealed) throw new Error('La encuesta no está revelada!')
}
