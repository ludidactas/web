import { Socket } from 'socket.io-client'

import { comandosPollsEstudiante, EventosPollsEstudiante } from '@/wss/contrato/polls'
import { VotarEncuesta } from '@/wss/validators/polls'
import { storeEncuestasEstudiante } from '../stores/encuestas-store'
import { comandos, escuchar } from '../contrato-cli'

/** Espejo cliente de `handlersEncuestasEstudiante`. */
export default function estudianteEncuestasHandlers(socket: Socket | null) {
  const encuestas = storeEncuestasEstudiante.getState()
  const cmd = comandos<typeof comandosPollsEstudiante>(socket)

  return {
    montar: () => {
      const dejarDeEscuchar = escuchar<EventosPollsEstudiante>(socket, {
        'polls:list': encuestas.set,
        'poll:updated': encuestas.update,
        'poll:deleted': encuestas.remove,
      })

      cmd.enviar('polls:list')

      return dejarDeEscuchar
    },

    acciones: {
      /** Postea un voto */
      votar: (voto: VotarEncuesta) => cmd.enviar('poll:vote', voto),
    },
  }
}
