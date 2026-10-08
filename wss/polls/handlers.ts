import { Socket } from 'socket.io'
import { comandosPollsEstudiante, comandosPollsOverlay, comandosPollsProfe } from '../contrato/polls'
import { registrar } from '../contrato/registrar'
import { conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { Sala, Salas } from '../salas/app'
import { Encuesta, PollIdPayload } from '../validators/polls'
import { broadcastPoll, estudianteSala, getEncuestaEnfocada, profeSala } from './app'

/**
 * Handlers de encuestas del profe, ligados a la sala abierta (`sala`). Se registran desde
 * `handlersSalaActivaProfe` al abrir la sala — no al conectar — así que `sala` es fija en closure.
 */
export const handlersEncuestasProfe = async (socket: SocketProfe, sala: Sala) => {
  const profe = await profeSala(sala.id)

  /** Comando que aplica `cambios` a la encuesta indicada y la broadcastea a la sala. */
  const actualizar =
    (cambios: Partial<Encuesta>) =>
    async ({ pollId }: PollIdPayload) =>
      broadcastPoll(sala, await profe.updatePoll(pollId, cambios))

  registrar(socket, comandosPollsProfe, {
    'poll:create': async (datos) => {
      await broadcastPoll(sala, await profe.crearPoll(datos))
    },

    // Pide todos los votos dentro de la sala de un usuario
    'poll:votos:usuario': async ({ userId }) => {
      socket.emit('poll:votos:usuario', { userId, votos: await profe.consultarVotosPorUsuario({ userId }) })
    },

    'poll:open': actualizar({ isOpen: true }),
    'poll:close': actualizar({ isOpen: false }),
    'poll:publish': actualizar({ isPublished: true }),
    'poll:hide': actualizar({ isPublished: false }),
    'poll:reveal': actualizar({ isRevealed: true }),
    'poll:unreveal': actualizar({ isRevealed: false }),

    'poll:focus': async ({ pollId }) => {
      const [enfocada, previa] = await profe.focusPoll(pollId)
      await broadcastPoll(sala, enfocada)
      if (previa) await broadcastPoll(sala, previa)
    },
    'poll:unfocus': async ({ pollId }) => broadcastPoll(sala, await profe.unfocusPoll(pollId)),

    'poll:delete': async ({ pollId }) => {
      await profe.deletePoll({ pollId })
      await sala.broadcast('poll:deleted', { pollId })
    },
  })
}

/** Registra los comandos del estudiante y devuelve su init (enviar la lista de encuestas). */
export const handlersEncuestasEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  // Se resuelven en segundo plano: registrar los comandos no espera I/O.
  const contexto = Promise.all([Salas.get(idSala), estudianteSala(idSala, socket.data.session.userId)])
  contexto.catch(() => {})

  const emitirLista = async () => {
    const [, estudiante] = await contexto
    socket.emit('polls:list', await estudiante.listar())
  }

  registrar(socket, comandosPollsEstudiante, {
    'polls:list': emitirLista,

    'poll:vote': async (voto) => {
      const [sala, estudiante] = await contexto
      await broadcastPoll(sala, await estudiante.votar(voto))
    },
  })

  // Init: la lista inicial. Con el wrapper, un throw no tira el proceso (unhandledRejection).
  return conErrorHandling(socket)(emitirLista)
}

export const handlersEncuestasOverlay = async (socket: Socket, idSala: string) => {
  socket.join(`sala:${idSala}:overlay`)

  console.log(`📺 Overlay conectado para sala ${idSala} (socket ${socket.id})`)

  registrar(socket, comandosPollsOverlay, {
    'poll:pedir_enfocada': async () => getEncuestaEnfocada(idSala),
  })
}
