import { ExtendedError, Socket } from 'socket.io'
import { conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { Salas } from '../salas/app'
import { broadcastPoll, estudianteSala, getEncuestaEnfocada, profeSala } from './app'

export const handlersEncuestasProfe = async (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)

  const sala = await Salas.getByEmailProfe(socket.data.session.email)
  const profe = await profeSala(sala.profe.email)

  socket.on(
    'poll:create',
    safe(async (poll: unknown, responder: (error?: ExtendedError) => void) => {
      try {
        const nueva = await profe.crearPoll(poll)
        await broadcastPoll(sala, nueva)
        responder()
      } catch (e: any) {
        console.error('Error creando encuesta:', e)
        responder(e.message)
      }
    })
  )

  socket.on(
    'poll:votantes',
    safe(async ({ pollId }) => {
      socket.emit('poll:votantes', { votantes: await profe.consultarVotantes({ pollId }) })
    })
  )

  // Pide todos los votos dentro de la sala de un usuario
  socket.on(
    'poll:votos:usuario',
    safe(async ({ userId }) => {
      socket.emit('poll:votos:usuario', { userId, votos: await profe.consultarVotosPorUsuario({ userId }) })
    })
  )

  socket.on(
    'poll:open',
    safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isOpen: true })))
  )
  socket.on(
    'poll:close',
    safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isOpen: false })))
  )
  socket.on(
    'poll:publish',
    safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isPublished: true })))
  )
  socket.on(
    'poll:hide',
    safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isPublished: false })))
  )
  socket.on(
    'poll:reveal',
    safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isRevealed: true })))
  )
  socket.on(
    'poll:unreveal',
    safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isRevealed: false })))
  )
  socket.on(
    'poll:focus',
    safe(async ({ pollId }) => {
      const [enfocada, previa] = await profe.focusPoll(pollId)
      await broadcastPoll(sala, enfocada)
      if (previa) await broadcastPoll(sala, previa)
    })
  )

  socket.on(
    'poll:delete',
    safe(async ({ pollId }) => {
      await profe.deletePoll({ pollId })
      await sala.broadcast('poll:deleted', { pollId })
    })
  )
}

export const handlersEncuestasEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  const sala = await Salas.get(idSala)

  const estudiante = await estudianteSala(idSala, socket.data.session.userId)

  // Si las pide, se las enviamos también
  socket.on(
    'polls:list',
    safe(async () => {
      socket.emit('polls:list', await estudiante.listar())
    })
  )

  // Estudiantes votan. Broadcasteamos la poll updateada.
  socket.on(
    'poll:vote',
    safe(async (posibleVoto: unknown) => {
      await broadcastPoll(sala, await estudiante.votar(posibleVoto))
    })
  )

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  const emitir = safe(async () => {
    socket.emit('polls:list', await estudiante.listar())
  })

  await emitir()
}

export const handlersEncuestasOverlay = async (socket: Socket, idSala: string) => {
  const safe = conErrorHandling(socket)

  socket.join(`sala:${idSala}:overlay`)

  console.log(`📺 Overlay conectado para sala ${idSala} (socket ${socket.id})`)

  // Al conectarse, enviamos la encuesta enfocada actual si la hay
  const emitir = safe(async () => {
    const encuesta = await getEncuestaEnfocada(idSala)
    if (encuesta) socket.emit('poll:updated', encuesta)
  })

  await emitir()
}
