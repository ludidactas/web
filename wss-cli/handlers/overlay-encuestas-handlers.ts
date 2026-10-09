import { Socket } from 'socket.io-client'

import { comandosPollsOverlay, EventosPollsOverlay } from '@/wss/contrato/polls'
import { overlayEncuestaStore } from '../stores/overlay-encuestas-store'
import { comandos, escuchar } from '../contrato-cli'

/** Espejo cliente de `handlersEncuestasOverlay`. */
export default function overlayEncuestasHandlers(socket: Socket | null) {
  const store = overlayEncuestaStore.getState()
  const cmd = comandos<typeof comandosPollsOverlay>(socket)

  return {
    montar: () => {
      if (!socket) return () => {}

      const dejarDeEscuchar = escuchar<EventosPollsOverlay>(socket, {
        'poll:updated': (encuesta) => {
          if (encuesta.isFocused) {
            store.set(encuesta)
          } else if (overlayEncuestaStore.getState().encuesta?.id === encuesta.id) {
            // La encuesta que teníamos enfocada fue desenfocada
            store.clear()
          }
        },

        'poll:deleted': ({ pollId }) => {
          if (overlayEncuestaStore.getState().encuesta?.id === pollId) {
            store.clear()
          }
        },
      })

      cmd
        .pedir('poll:pedir_enfocada')
        .then((enfocada) => {
          if (enfocada) store.set(enfocada)
        })
        .catch((err) => console.error('Error pidiendo la encuesta enfocada:', err))

      return dejarDeEscuchar
    },

    acciones: {},
  }
}
