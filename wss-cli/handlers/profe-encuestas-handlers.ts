import { Socket } from 'socket.io-client'

import { CrearEncuesta } from '@/wss/validators/polls'
import { storeEncuestasProfe } from '../stores/encuestas-store'
import { storeEstudiantes } from '../stores/estudiantes-store'

/** Modela las acciones del server */
const profeEncuestasHandlers = (socket: Socket | null) => {
  const store = storeEncuestasProfe.getState()

  const estudiantes = storeEstudiantes.getState()

  return {
    montar: () => {
      if (!socket) return

      socket.on('polls:list', store.set)
      socket.on('poll:updated', store.update)
      socket.on('poll:created', store.add)
      socket.on('poll:deleted', store.remove)

      socket.on('poll:votos:usuario', estudiantes.cargarVotosEstudiante)
    },

    // pregunta: string, opciones: string[], admiteAportes = false
    acciones: {
      crear: (encuesta: CrearEncuesta) =>
        new Promise<void>((resolve, reject) => {
          if (!socket) return reject('No hay socket conectado para enviar preguntas!')

          // Emitimos con callback, para esperar la respuesta del server.
          socket.emit('poll:create', encuesta, (error?: string) => {
            if (error) reject(error)
            else resolve()
          })
        }),

      borrar: (id: string) => socket?.emit('poll:delete', { pollId: id }),

      cerrar: (id: string) => socket?.emit('poll:close', { pollId: id }),

      abrir: (id: string) => socket?.emit('poll:open', { pollId: id }),

      publicar: (id: string) => socket?.emit('poll:publish', { pollId: id }),

      esconder: (id: string) => socket?.emit('poll:hide', { pollId: id }),

      enfocar: (id: string) => socket?.emit('poll:focus', { pollId: id }),

      desenfocar: (id: string) => socket?.emit('poll:unfocus', { pollId: id }),

      revelar: (id: string) => socket?.emit('poll:reveal', { pollId: id }),

      ocultar: (id: string) => socket?.emit('poll:unreveal', { pollId: id }),

      pedirVotosEstudiante: (userId: string) => socket?.emit('poll:votos:usuario', { userId }),
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
export default profeEncuestasHandlers
