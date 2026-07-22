import { ConfigCreacionSala } from '@/wss/validators/salas'
import type { Ack } from '@/wss/middleware/error-handling'
import { Socket } from 'socket.io-client'
import { SalaResumen, storeSalas } from '../stores/salas-store'

/** GESTIÓN (ABM) — espejo cliente de `handlersGestionSalasProfe`. */
export default function profeGestionSalasHandlers(socket: Socket | null) {
  const almacenSalas = storeSalas.getState()

  return {
    montar: () => {
      if (!socket) return

      socket.on('salas:lista', (salas: SalaResumen[]) => almacenSalas.set(salas ?? []))
    },

    acciones: {
      listarSalas: () => socket?.emit('salas:listar'),
      // Comando con ack: resuelve con el id de la sala nueva para que el form navegue a operarla.
      crearSala: async (payload: { config?: ConfigCreacionSala }): Promise<string> => {
        if (!socket) throw new Error('Sin conexión')
        const res: Ack<{ idSala: string }> = await socket.timeout(5000).emitWithAck('sala:crear', payload)
        if (!res.ok) throw new Error(res.error)
        return res.data.idSala
      },
      renombrarSala: (idSala: string, nombre: string) => socket?.emit('sala:renombrar', { idSala, nombre }),
      eliminarSala: (idSala: string) => socket?.emit('sala:eliminar', { idSala }),
      abrirSala: (idSala: string) => socket?.emit('sala:abrir', { idSala }),
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('salas:lista')
    },
  }
}
