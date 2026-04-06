import { assert } from 'console'
import { isEmpty, merge } from 'remeda'
import db from '../db'
import { Salas } from '../salas/app'
import { Encuesta, EncuestaHidratada, RolEncuesta } from '../tipos'
import { pollBase, voteValidator } from '../validators/polls'

/** Crea un closure para operar los componentes de una sala */
export async function profeSala(email: string) {
  const { id: salaId } = await Salas.getByEmailProfe(email)

  // Acciones de profe:

  async function listarEncuestas() {
    const polls = await db.hgetall(`sala:${salaId}:polls`)
    return Object.values(polls).map((pollStr) => JSON.parse(pollStr) as Encuesta)
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

    // La agregamos a los polls activos y creamos el tracker de quién ya voto y qué
    await db.hset(`sala:${salaId}:polls`, poll.id, JSON.stringify(poll))

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
    const pollStr = await db.hget(`sala:${salaId}:polls`, pollId)
    const poll: Encuesta = JSON.parse(pollStr!)

    // Dependiendo de qué se actualice, validamos:
    if (update.isOpen === true) assertPollIsClosed(poll)
    if (update.isOpen === false) assertPollIsOpen(poll)
    if (update.isPublished === true) assertPollIsHidden(poll)
    if (update.isPublished === false) assertPollIsPublished(poll)
    if (update.isFocused === true) assertPollIsUnfocused(poll)
    if (update.isRevealed === true) assertPollIsNotRevealed(poll)
    if (update.isRevealed === false) assertPollIsRevealed(poll)
    if (update.admiteAportes === false && !poll.admiteAportes) throw new Error('La encuesta ya no admite aportes')
    if (update.admiteAportes === true && poll.admiteAportes) throw new Error('La encuesta ya admite aportes')

    const nueva = merge(poll, update) as Encuesta
    await db.hset(`sala:${salaId}:polls`, pollId, JSON.stringify(nueva))
    console.log(`🔔 Encuesta ${poll.id} updateada:`, JSON.stringify(update))

    return nueva
  }

  async function deletePoll({ pollId }: { pollId: string }) {
    // Validamos
    await assertPollExists(salaId, pollId)

    // La borramos
    await db.hdel(`sala:${salaId}:polls`, pollId)

    // Borramos los votos por usuario y el set de votantes
    const votantes = await db.smembers(`sala:${salaId}:poll:${pollId}:votantes`)
    if (votantes.length > 0) {
      await Promise.all(votantes.map((uid) => db.del(`sala:${salaId}:poll:${pollId}:votos:${uid}`)))
    }
    await db.del(`sala:${salaId}:poll:${pollId}:votantes`)

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
    const pollStr = await db.hget(`sala:${salaId}:polls`, pollId)
    if (!pollStr) throw new Error('Encuesta no encontrada')

    const poll: Encuesta = JSON.parse(pollStr!)
    return poll
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

    // Agarramos la encuesta
    const pollStr = await db.hget(`sala:${idSala}:polls`, pollId)
    const poll: Encuesta = JSON.parse(pollStr!)

    // Validamos
    assertPollIsOpen(poll)

    // Si no admite múltiples votos, validamos que el estudiante no haya votado todavía
    if (!poll.admiteMultiplesVotos) await assertElEstudianteNoVotoTodavia(poll, userId)

    // Si admite múltiples votos, validamos que no haya superado el máximo de votos permitidos (si es que tiene un máximo)
    if (poll.admiteMultiplesVotos && poll.maxMultiplesVotos) {
      const votosDelEstudiante = await db.scard(`sala:${idSala}:poll:${pollId}:votos:${userId}`)
      assert(
        votosDelEstudiante < poll.maxMultiplesVotos,
        `Ya emitiste el máximo de ${poll.maxMultiplesVotos} votos permitidos en esta encuesta`
      )
    }

    // Si el voto es un aporte...
    if (tipo === 'aporte') {
      // ...validamos que la encuesta lo permita
      assert(poll.admiteAportes, 'Esta encuesta no admite aportes')
      assert(!isEmpty(voto.aporte), 'El aporte no puede estar vacío')

      // Creamos y guardamos una opción nueva
      const nuevoId = poll.opciones.length.toString()
      poll.opciones.push({ id: nuevoId, texto: voto.aporte, votos: 1 })

      // Registramos el voto de este usuario a esta opción
      console.log(`Grabando voto a opción ${nuevoId} de la encuesta ${pollId} para el usuario ${userId}`)
      await db.sadd(`sala:${idSala}:poll:${pollId}:votos:${userId}`, nuevoId)
    }

    // Si es una opción preexistente...
    if (tipo === 'opcion') {
      // Agarramos la opcion existente e incrementamos en 1 sus votos
      const opc = poll.opciones.find((opcion) => opcion.id === voto.optionId)
      if (!opc) throw new Error('Opción no encontrada')

      // Incrementamos los votos
      poll.opciones[poll.opciones.indexOf(opc)].votos++

      // Registramos el voto de este usuario a esta opción
      await db.sadd(`sala:${idSala}:poll:${pollId}:votos:${userId}`, voto.optionId)
    }

    // Updateamos la encuesta en la DB
    await db.hset(`sala:${idSala}:polls`, poll.id, JSON.stringify(poll))

    // Registramos el voto
    await db.sadd(`sala:${idSala}:poll:${pollId}:votantes`, userId)

    return poll
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
  const votosEmitidos = await db.smembers(`sala:${idSala}:poll:${poll.id}:votos:${idVotante}`)

  console.log(
    `🔎 Hidratando encuesta ${poll.id} para estudiante ${idVotante}:`,
    votosEmitidos.length > 0 ? `ya votó opciones ${votosEmitidos.join(', ')}` : 'no votó todavía'
  )

  let puedoVotar = true
  if (!poll.admiteMultiplesVotos) {
    puedoVotar = votosEmitidos.length === 0
  } else {
    // Si no hay max y no admite aportes, el max es el número de opciones, porque no tiene sentido votar más veces que las opciones que hay.
    if (!poll.maxMultiplesVotos && !poll.admiteAportes) puedoVotar = votosEmitidos.length < poll.opciones.length
    // Si hay max, lo respetamos aunque admita aportes, porque si no el estudiante podría votar infinitas veces aportando opciones nuevas.
    else if (poll.maxMultiplesVotos) puedoVotar = votosEmitidos.length < poll.maxMultiplesVotos
  }

  return {
    ...poll,
    puedoVotar,
    votosEmitidos,
  }
}

/** Devuelve la lista de encuestas publicadas hidratadas para un user  */
export async function hidratadas(salaId: string, userId: string) {
  const sala = await Salas.get(salaId)

  // Agarramos todas las encuestas de la sala de la db
  const pollsSalaStr = await db.hgetall(`sala:${sala.id}:polls`)
  const pollsSala = Object.values(pollsSalaStr).map((pollStr) => JSON.parse(pollStr) as Encuesta)

  return await Promise.all(pollsSala.filter((e) => e.isPublished).map((poll) => hidratar(sala.id, poll, userId)))
}

// Assertions para validar los eventos

async function assertPollExists(idSala: string, idPoll: string) {
  const existe = await db.hexists(`sala:${idSala}:polls`, idPoll)
  if (!existe) throw new Error(`La encuesta ${idPoll} no existe!`)
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
