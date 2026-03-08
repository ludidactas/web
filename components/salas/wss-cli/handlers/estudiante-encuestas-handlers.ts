import { Socket } from 'socket.io-client'

import { storeEncuestas } from '../stores/encuestas-store'

export default function estudianteEncuestasHandlers(socket: Socket | null) {
  const encuestas = storeEncuestas.getState()

  return {
    montar: () => {
      if (!socket) return

      socket.on('polls:list', encuestas.set)
      socket.on('poll:updated', encuestas.update)
      socket.on('poll:created', encuestas.add)
      socket.on('poll:deleted', encuestas.remove)
    },

    acciones: {
      /** Postea un voto */
      votar: (pollId: string, optionId?: string, aporte?: string) => {
        if (!socket) return
        if (aporte) socket.emit('poll:vote', { pollId, aporte })
        else socket.emit('poll:vote', { pollId, optionId })
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
