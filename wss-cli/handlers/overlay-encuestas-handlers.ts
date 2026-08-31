import { Socket } from 'socket.io-client'

import type { Ack } from '@/wss/middleware/error-handling'
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

      socket
        .emitWithAck('poll:pedir_enfocada')
        .then((res: Ack<EncuestaConVotos | null>) => {
          if (res.ok) {
            if (res.data) store.set(res.data)
          } else {
            console.error('Error pidiendo la encuesta enfocada:', res.error)
          }
        })
        .catch((err) => console.error('Error pidiendo la encuesta enfocada:', err))
    },

    acciones: {},

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('poll:updated')
      socket.removeAllListeners('poll:deleted')
    },
  }
}
