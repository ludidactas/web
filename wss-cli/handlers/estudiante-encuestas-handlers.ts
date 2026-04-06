import { Socket } from 'socket.io-client'

import { storeEncuestas } from '../stores/encuestas-store'
import { VotarEncuesta } from '@/wss/validators/polls'

export default function estudianteEncuestasHandlers(socket: Socket | null) {
  const encuestas = storeEncuestas.getState()

  return {
    montar: () => {
      if (!socket) return

      socket.on('polls:list', (encs) => {
        encuestas.set(encs)
        console.log('Recibidas encuestas', encs)
      })
      socket.on('poll:updated', encuestas.update)
      socket.on('poll:created', encuestas.add)
      socket.on('poll:deleted', encuestas.remove)
    },

    acciones: {
      /** Postea un voto */
      votar: (voto: VotarEncuesta) => {
        if (!socket) return
        socket.emit('poll:vote', voto)
      },
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('polls:list')
      socket.removeAllListeners('poll:updated')
      socket.removeAllListeners('poll:created')
      socket.removeAllListeners('poll:deleted')
    },
  }
}
