import { isEmpty, mapValues, merge } from 'remeda'
import db from '../db'
import { Salas } from '../salas/app'
import { Encuesta, EncuestaHidratada, RolEncuesta } from '../tipos'
import { pollBase, voteValidator } from '../validators/polls'

/** Crea un closure para operar los componentes de una sala */
export async function profeSala(email: string) {
  const { id: salaId } = await Salas.getByEmailProfe(email)

  // Acciones de profe:

  async function listarEncuestas() {
    const pollIds = await db.smembers(`sala:${salaId}:polls`)
    const polls = await Promise.all(
      pollIds.map(async (pollId) => {
        const str = await db.get(`sala:${salaId}:polls:${pollId}`)
        return JSON.parse(str!) as Encuesta
      })
    )
    return await Promise.all(polls.map((p) => pollConVotos(salaId, p.id, p)))
  }

  async function crearPoll(pollDataUnknown: unknown) {
    // Parseamos con el validator
    const pollData = pollBase.parse(pollDataUnknown)

    // La creamos
    const poll: Encuesta = {
      id: Date.now().toString(),

      pregunta: pollData.pregunta,
      opciones: pollData.opciones.map((opc, i) => ({ id: i.toString(), texto: opc, votos: 0 })),
      createdAt: new Date().toISOString(),

      // Estado
      isOpen: true,
      isPublished: true,
      isFocused: false /** @todo Enfocar por default al crear */,
      isRevealed: false,

      // Estas se configuran solo al crear la encuesta y no se pueden updatear después:
      admiteAportes: pollData.admiteAportes,
      admiteMultiplesVotos: pollData.admiteMultiplesVotos,
      maxMultiplesVotos: pollData.maxMultiplesVotos,
    }

    // Guardamos la config y la registramos en el índice
    await db.set(`sala:${salaId}:polls:${poll.id}`, JSON.stringify(poll))
    await db.sadd(`sala:${salaId}:polls`, poll.id)

    console.log(`➕ Encuesta creada: ${poll.pregunta} (id ${poll.id})`)

    return poll
  }

  async function consultarVotantes({ pollId }: { pollId: string }) {
    await assertPollExists(salaId, pollId)

    // Agarramos los votantes y sus votos
    const votantes = await db.smembers(`sala:${salaId}:poll:${pollId}:votantes`)

    return await Promise.all(
      votantes.map(async (userId) => ({
        userId,
        votos: await db.smembers(`sala:${salaId}:poll:${pollId}:votos:${userId}`),
      }))
    )
  }

  async function updatePoll(pollId: string, update: Partial<Encuesta>) {
    await assertPollExists(salaId, pollId)

    // Agarramos la encuesta
    const pollStr = await db.get(`sala:${salaId}:polls:${pollId}`)
    const poll: Encuesta = JSON.parse(pollStr!)

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
    await db.set(`sala:${salaId}:polls:${pollId}`, JSON.stringify(nueva))
    console.log(`🔔 Encuesta ${poll.id} updateada:`, JSON.stringify(update))

    return await pollConVotos(salaId, pollId, nueva)
  }

  async function deletePoll({ pollId }: { pollId: string }) {
    // Validamos
    await assertPollExists(salaId, pollId)

    // La borramos del índice y su clave propia
    await db.srem(`sala:${salaId}:polls`, pollId)
    await db.del(`sala:${salaId}:polls:${pollId}`)

    // Borramos los votos por opción, por usuario y el set de votantes
    const votantes = await db.smembers(`sala:${salaId}:poll:${pollId}:votantes`)
    if (votantes.length > 0) {
      await Promise.all(votantes.map((uid) => db.del(`sala:${salaId}:poll:${pollId}:votos:${uid}`)))
    }
    await db.del(`sala:${salaId}:poll:${pollId}:votantes`)
    await db.del(`sala:${salaId}:poll:${pollId}:votos`)

    // Si estaba enfocada, desenfocamos
    const enfocada = await db.get(`sala:${salaId}:polls:focused`)
    if (enfocada === pollId) db.del(`sala:${salaId}:polls:focused`)

    console.log(`🗑️  Encuesta borrada: ${pollId}`)
  }

  async function focusPoll(pollId: string) {
    // Nos fijamos si ya hay una encuesta focuseada y en tal caso la desenfocamos
    const enfocada = await db.get(`sala:${salaId}:polls:focused`)

    // Enfocamos la nueva
    await db.set(`sala:${salaId}:polls:focused`, pollId)

    if (enfocada) console.log(`👀 Encuesta ${enfocada} desenfocada!`)

    // Devolvemos la nueva y la anterior
    if (enfocada)
      return [await updatePoll(pollId, { isFocused: true }), await updatePoll(enfocada, { isFocused: false })] as const

    // O solo la nueva
    return [await updatePoll(pollId, { isFocused: true }), null] as const
  }

  async function consultarResultados(pollId: string) {
    const pollStr = await db.get(`sala:${salaId}:polls:${pollId}`)
    if (!pollStr) throw new Error('Encuesta no encontrada')

    const poll: Encuesta = JSON.parse(pollStr)
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
    if (await db.sismember(`sala:${idSala}:poll:${poll.id}:votantes`, user))
      throw new Error('Ya votaste en esta encuesta')
  }

  async function votar(posibleVoto: unknown) {
    const voto = voteValidator.parse(posibleVoto)
    const { pollId, tipo } = voto

    await assertPollExists(idSala, pollId)

    // Agarramos la config de la encuesta (sin votos — viven en su propio hash)
    const pollStr = await db.get(`sala:${idSala}:polls:${pollId}`)
    const poll: Encuesta = JSON.parse(pollStr!)

    // Validamos que esté abierta
    enforce(poll.isOpen, 'La encuesta ya cerró!')

    // Si no admite múltiples votos, validamos que el estudiante no haya votado todavía
    if (!poll.admiteMultiplesVotos) await assertElEstudianteNoVotoTodavia(poll, userId)

    // Si admite múltiples votos, validamos que no haya superado el máximo de votos permitidos (si es que tiene un máximo)
    if (poll.admiteMultiplesVotos && poll.maxMultiplesVotos) {
      const votosDelEstudiante = await db.scard(`sala:${idSala}:poll:${pollId}:votos:${userId}`)
      enforce(
        votosDelEstudiante < poll.maxMultiplesVotos,
        `Ya emitiste el máximo de ${poll.maxMultiplesVotos} votos permitidos en esta encuesta`
      )
    }

    // Si el voto es un aporte...
    if (tipo === 'aporte') {
      // ...validamos que la encuesta lo permita
      enforce(poll.admiteAportes, 'Esta encuesta no admite aportes')
      enforce(!isEmpty(voto.aporte), 'El aporte no puede estar vacío')
      enforce(
        !poll.opciones.find((opc) => opc.texto.toLowerCase() === voto.aporte.toLowerCase()),
        'Esa opción ya existe'
      )

      // Agregamos la nueva opción al JSON de config (solo texto, sin votos)
      const nuevoId = poll.opciones.length.toString()
      poll.opciones.push({ id: nuevoId, texto: voto.aporte, votos: 0 })

      console.log(`Grabando voto a opción ${nuevoId} de la encuesta ${pollId} para el usuario ${userId}`)
      await db.set(`sala:${idSala}:polls:${pollId}`, JSON.stringify(poll))

      // Voto inicial en el hash atómico
      await db.hincrby(`sala:${idSala}:poll:${pollId}:votos`, nuevoId, 1)
      await db.sadd(`sala:${idSala}:poll:${pollId}:votos:${userId}`, nuevoId)
    }

    // Si es una opción preexistente...
    if (tipo === 'opcion') {
      if (!poll.opciones.find((opc) => opc.id === voto.optionId)) throw new Error('Opción no encontrada')

      // Incremento atómico — sin read-modify-write sobre el JSON de config
      await db.hincrby(`sala:${idSala}:poll:${pollId}:votos`, voto.optionId, 1)
      await db.sadd(`sala:${idSala}:poll:${pollId}:votos:${userId}`, voto.optionId)
    }

    // Registramos el votante
    await db.sadd(`sala:${idSala}:poll:${pollId}:votantes`, userId)

    // Devolvemos la poll con votos frescos del hash dedicado
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
    if (socket.data.session && socket.data.session.rol === RolEncuesta.Estudiante) {
      return await hidratar(sala.id, poll as Encuesta, socket.data.session.userId)
    }
    return poll
  })
}

/** Hidrata una encuesta con la info del estudiante (si ya votó y qué opción) */
export async function hidratar(idSala: string, poll: Encuesta, idVotante: string): Promise<EncuestaHidratada> {
  const [votosEmitidos, pollActual] = await Promise.all([
    db.smembers(`sala:${idSala}:poll:${poll.id}:votos:${idVotante}`),
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

  const pollIds = await db.smembers(`sala:${sala.id}:polls`)
  const polls = await Promise.all(
    pollIds.map(async (pollId) => {
      const str = await db.get(`sala:${sala.id}:polls:${pollId}`)
      return JSON.parse(str!) as Encuesta
    })
  )

  return await Promise.all(polls.filter((e) => e.isPublished).map((poll) => hidratar(sala.id, poll, userId)))
}

// Helpers

/** Merge los votos del hash dedicado en el objeto poll. Siempre llamar antes de devolver un poll a un consumer externo. */
async function pollConVotos(salaId: string, pollId: string, poll: Encuesta): Promise<Encuesta> {
  const raw = await db.hgetall(`sala:${salaId}:poll:${pollId}:votos`)
  const votos = raw ? mapValues(raw, (v) => parseInt(v)) : {}
  return {
    ...poll,
    opciones: poll.opciones.map((opc) => ({ ...opc, votos: votos[opc.id] ?? 0 })),
  }
}

// Assertions para validar los eventos

async function assertPollExists(idSala: string, idPoll: string) {
  const existe = await db.exists(`sala:${idSala}:polls:${idPoll}`)
  if (!existe) throw new Error(`La encuesta ${idPoll} no existe!`)
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
