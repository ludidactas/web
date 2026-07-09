import { Socket } from 'socket.io-client'

import { EncuestaConVotos } from '@/wss/validators/polls'
import { overlayEncuestaStore } from '../stores/overlay-encuestas-store'

export default function overlayEncuestasHandlers(socket: Socket | null) {
  const store = overlayEncuestaStore.getState()

  return {
    montar: () => {
      if (!socket) return

      socket.on('poll:updated', (encuesta: EncuestaConVotos) => {
        if (encuesta.isFocused) {
          store.set(encuesta)
        } else if (overlayEncuestaStore.getState().encuesta?.id === encuesta.id) {
          // La encuesta que teníamos enfocada fue desenfocada
          store.clear()
        }
      })

      socket.on('poll:deleted', ({ pollId }: { pollId: string }) => {
        if (overlayEncuestaStore.getState().encuesta?.id === pollId) {
          store.clear()
        }
      })
    },

    acciones: {},

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('poll:updated')
      socket.removeAllListeners('poll:deleted')
    },
  }
}
