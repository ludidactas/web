import { Socket } from 'socket.io-client'

import { comandosPollsProfe, EventosPollsProfe } from '@/wss/contrato/polls'
import { CrearEncuesta } from '@/wss/validators/polls'
import { storeEncuestasProfe } from '../stores/encuestas-store'
import { storeEstudiantes } from '../stores/estudiantes-store'
import { comandos, escuchar } from '../contrato-cli'

/** Espejo cliente de `handlersEncuestasProfe`. */
const profeEncuestasHandlers = (socket: Socket | null) => {
  const store = storeEncuestasProfe.getState()
  const estudiantes = storeEstudiantes.getState()
  const cmd = comandos<typeof comandosPollsProfe>(socket)

  let dejarDeEscuchar = () => {}

  return {
    montar: () => {
      dejarDeEscuchar = escuchar<EventosPollsProfe>(socket, {
        'poll:updated': store.update,
        'poll:deleted': store.remove,
        'poll:votos:usuario': estudiantes.cargarVotosEstudiante,
      })
    },

    acciones: {
      /** Resuelve cuando el server creó la encuesta; rechaza con el motivo si no pudo. */
      crear: (encuesta: CrearEncuesta) => cmd.pedir('poll:create', encuesta),

      borrar: (pollId: string) => cmd.enviar('poll:delete', { pollId }),
      cerrar: (pollId: string) => cmd.enviar('poll:close', { pollId }),
      abrir: (pollId: string) => cmd.enviar('poll:open', { pollId }),
      publicar: (pollId: string) => cmd.enviar('poll:publish', { pollId }),
      esconder: (pollId: string) => cmd.enviar('poll:hide', { pollId }),
      enfocar: (pollId: string) => cmd.enviar('poll:focus', { pollId }),
      desenfocar: (pollId: string) => cmd.enviar('poll:unfocus', { pollId }),
      revelar: (pollId: string) => cmd.enviar('poll:reveal', { pollId }),
      ocultar: (pollId: string) => cmd.enviar('poll:unreveal', { pollId }),

      pedirVotosEstudiante: (userId: string) => cmd.enviar('poll:votos:usuario', { userId }),
    },

    desmontar: () => dejarDeEscuchar(),
  }
}
export default profeEncuestasHandlers
