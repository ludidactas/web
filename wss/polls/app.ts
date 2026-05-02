import { isEmpty, merge } from 'remeda'
import { Salas } from '../salas/app'
import { Encuesta, EncuestaHidratada } from '../validators/polls'
import { RolSala } from '../validators/auth'
import { nuevaEncuesta, voteValidator } from '../validators/polls'
import * as db from './db'

/** Crea un closure para operar los componentes de una sala */
export async function profeSala(email: string) {
  const { id: salaId } = await Salas.getByEmailProfe(email)

  // Acciones de profe:

  async function listarEncuestas() {
    const pollIds = await db.getIdsEncuestas(salaId)
    const polls = (await Promise.all(pollIds.map((pollId) => db.getEncuesta(salaId, pollId)))).filter(
      (p): p is Encuesta => p !== null
    )
    return await Promise.all(polls.map((p) => pollConVotos(salaId, p.id, p)))
  }

  async function crearPoll(pollDataUnknown: unknown) {
    const poll: Encuesta = {
      // Estas dos son server state, no corresponden en el validator:
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      // Validamos el resto del input
      ...nuevaEncuesta.parse(pollDataUnknown),
    }

    await db.guardarEncuesta(salaId, poll)
    await db.registarEncuestas(salaId, poll.id)

    console.log(`➕ Encuesta creada: ${poll.pregunta} (id ${poll.id})`)

    return poll
  }

  async function consultarVotantes({ pollId }: { pollId: string }) {
    await assertPollExists(salaId, pollId)

    const votantes = await db.getVotantes(salaId, pollId)

    return await Promise.all(
      votantes.map(async (userId) => ({
        userId,
        votos: await db.getVotosUsuario(salaId, pollId, userId),
      }))
    )
  }

  async function updatePoll(pollId: string, update: Partial<Encuesta>) {
    await assertPollExists(salaId, pollId)

    const poll = (await db.getEncuesta(salaId, pollId))!

    // Dependiendo de qué se actualice, validamos:
    if (update.isOpen === true) enforce(!poll.isOpen, 'La encuesta ya está abierta!!')
    if (update.isOpen === false) enforce(poll.isOpen, 'La encuesta ya cerró!')
    if (update.isPublished === true) enforce(!poll.isPublished, 'La encuesta ya está oculta!')
    if (update.isPublished === false) enforce(poll.isPublished, 'La encuesta no está publicada!')
    if (update.isFocused === true) enforce(!poll.isFocused, 'La encuesta ya está focuseada!')
    if (update.isRevealed === true) enforce(!poll.isRevealed, 'La encuesta ya está revelada!')
    if (update.isRevealed === false) enforce(poll.isRevealed, 'La encuesta no está revelada!')
    if (update.admiteAportes === false) enforce(poll.admiteAportes, 'La encuesta ya no admite aportes')
    if (update.admiteAportes === true) enforce(!poll.admiteAportes, 'La encuesta ya admite aportes')

    const nueva = merge(poll, update) as Encuesta
    await db.guardarEncuesta(salaId, nueva)
    console.log(`🔔 Encuesta ${poll.id} updateada:`, JSON.stringify(update))

    return await pollConVotos(salaId, pollId, nueva)
  }

  async function deletePoll({ pollId }: { pollId: string }) {
    await assertPollExists(salaId, pollId)

    // Borramos del índice y su clave
    await db.desregistrarEncuesta(salaId, pollId)
    await db.borrarEncuesta(salaId, pollId)

    // Borramos los votos por usuario y el hash global
    const votantes = await db.getVotantes(salaId, pollId)
    if (votantes.length > 0) {
      await Promise.all(votantes.map((uid) => db.borrarVotosUsuario(salaId, pollId, uid)))
    }
    await db.borrarVotantes(salaId, pollId)
    await db.limpiarVotos(salaId, pollId)

    // Si estaba enfocada, desenfocamos
    const enfocada = await db.getEnfocada(salaId)
    if (enfocada === pollId) await db.limpiarEnfocada(salaId)

    console.log(`🗑️  Encuesta borrada: ${pollId}`)
  }

  async function focusPoll(pollId: string) {
    // Nos fijamos si ya hay una encuesta enfocada para poder desfocarla después
    const enfocada = await db.getEnfocada(salaId)

    // Enfocamos la nueva
    await db.setEnfocada(salaId, pollId)

    if (enfocada) console.log(`👀 Encuesta ${enfocada} desenfocada!`)

    // Devolvemos la nueva y la anterior, o solo la nueva
    if (enfocada)
      return [await updatePoll(pollId, { isFocused: true }), await updatePoll(enfocada, { isFocused: false })] as const

    return [await updatePoll(pollId, { isFocused: true }), null] as const
  }

  async function consultarResultados(pollId: string) {
    const poll = await db.getEncuesta(salaId, pollId)
    if (!poll) throw new Error('Encuesta no encontrada')

    return await pollConVotos(salaId, pollId, poll)
  }

  return {
    listarEncuestas,
    consultarResultados,
    consultarVotantes,
    crearPoll,
    updatePoll,
    deletePoll,
    focusPoll,
  }
}

export async function estudianteSala(idSala: string, userId: string) {
  // Acciones de estudiante:

  async function assertElEstudianteNoVotoTodavia(poll: Encuesta, user: string) {
    if (await db.yaVoto(idSala, poll.id, user)) throw new Error('Ya votaste en esta encuesta')
  }

  async function votar(posibleVoto: unknown) {
    const voto = voteValidator.parse(posibleVoto)
    const { pollId, tipo } = voto

    await assertPollExists(idSala, pollId)

    const poll = (await db.getEncuesta(idSala, pollId))!

    enforce(poll.isOpen, 'La encuesta ya cerró!')

    if (!poll.admiteMultiplesVotos) await assertElEstudianteNoVotoTodavia(poll, userId)

    if (poll.admiteMultiplesVotos && poll.maxMultiplesVotos) {
      const votosDelEstudiante = await db.contarVotosUsuario(idSala, pollId, userId)
      enforce(
        votosDelEstudiante < poll.maxMultiplesVotos,
        `Ya emitiste el máximo de ${poll.maxMultiplesVotos} votos permitidos en esta encuesta`
      )
    }

    if (tipo === 'aporte') {
      enforce(poll.admiteAportes, 'Esta encuesta no admite aportes')
      enforce(!isEmpty(voto.aporte), 'El aporte no puede estar vacío')
      enforce(
        !poll.opciones.find((opc) => opc.texto.toLowerCase() === voto.aporte.toLowerCase()),
        'Esa opción ya existe'
      )

      // Agregamos la nueva opción al JSON de la encuesta (solo texto, sin votos)
      const nuevoId = poll.opciones.length.toString()
      poll.opciones.push({ id: nuevoId, texto: voto.aporte, votos: 0 })

      console.log(`Grabando voto a opción ${nuevoId} de la encuesta ${pollId} para el usuario ${userId}`)
      await db.guardarEncuesta(idSala, poll)

      // Voto inicial
      await db.incrementarVoto(idSala, pollId, nuevoId)
      await db.addVotoUsuario(idSala, pollId, userId, nuevoId)
    }

    if (tipo === 'opcion') {
      if (!poll.opciones.find((opc) => opc.id === voto.optionId)) throw new Error('Opción no encontrada')

      // Incremento atómico
      await db.incrementarVoto(idSala, pollId, voto.optionId)
      await db.addVotoUsuario(idSala, pollId, userId, voto.optionId)
    }

    // Registramos al estudiante como votante
    await db.addVotante(idSala, pollId, userId)

    return await pollConVotos(idSala, pollId, poll)
  }

  async function listar() {
    return await hidratadas(idSala, userId)
  }

  return {
    listar,
    votar,
  }
}

/** Envía a admin, profe y a estudiantes una poll pero hidratada para cada quien  */
export async function broadcastPoll(sala: Awaited<ReturnType<typeof Salas.get>>, poll: Encuesta) {
  await sala.broadcast('poll:updated', poll, async (poll, socket) => {
    if (socket.data.session && socket.data.session.rol === RolSala.Estudiante) {
      return await hidratar(sala.id, poll as Encuesta, socket.data.session.userId)
    }
    return poll
  })
}

/** Hidrata una encuesta con la info del estudiante (si ya votó y qué opción) */
export async function hidratar(idSala: string, poll: Encuesta, idVotante: string): Promise<EncuestaHidratada> {
  const [votosEmitidos, pollActual] = await Promise.all([
    db.getVotosUsuario(idSala, poll.id, idVotante),
    pollConVotos(idSala, poll.id, poll),
  ])

  console.log(
    `🔎 Hidratando encuesta ${poll.id} para estudiante ${idVotante}:`,
    votosEmitidos.length > 0 ? `ya votó opciones ${votosEmitidos.join(', ')}` : 'no votó todavía'
  )

  let puedoVotar = true
  if (!pollActual.admiteMultiplesVotos) {
    puedoVotar = votosEmitidos.length === 0
  } else {
    // Si no hay max y no admite aportes, el max es el número de opciones, porque no tiene sentido votar más veces que las opciones que hay.
    if (!pollActual.maxMultiplesVotos && !pollActual.admiteAportes)
      puedoVotar = votosEmitidos.length < pollActual.opciones.length
    // Si hay max, lo respetamos aunque admita aportes, porque si no el estudiante podría votar infinitas veces aportando opciones nuevas.
    else if (pollActual.maxMultiplesVotos) puedoVotar = votosEmitidos.length < pollActual.maxMultiplesVotos
  }

  return {
    ...pollActual,
    puedoVotar,
    votosEmitidos,
  }
}

/** Devuelve la lista de encuestas publicadas hidratadas para un user  */
export async function hidratadas(salaId: string, userId: string) {
  const sala = await Salas.get(salaId)

  const pollIds = await db.getIdsEncuestas(sala.id)
  const polls = (await Promise.all(pollIds.map((pollId) => db.getEncuesta(sala.id, pollId)))).filter(
    (p): p is Encuesta => p !== null
  )

  return await Promise.all(polls.filter((e) => e.isPublished).map((poll) => hidratar(sala.id, poll, userId)))
}

// Helpers

/** Merge los votos del hash dedicado en el objeto poll. Siempre llamar antes de devolver un poll a un consumer externo. */
async function pollConVotos(salaId: string, pollId: string, poll: Encuesta): Promise<Encuesta> {
  const votos = await db.getVotos(salaId, pollId)
  return {
    ...poll,
    opciones: poll.opciones.map((opc) => ({ ...opc, votos: votos[opc.id] ?? 0 })),
  }
}

// Assertions para validar los eventos

async function assertPollExists(idSala: string, idPoll: string) {
  if (!(await db.existeEncuesta(idSala, idPoll))) throw new Error(`La encuesta ${idPoll} no existe!`)
}

export class ConsistencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsistencyError'
  }
}

function enforce(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ConsistencyError(message)
}
