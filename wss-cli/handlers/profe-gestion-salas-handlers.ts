import { ConfigCreacionSala } from '@/wss/validators/salas'
import { Socket } from 'socket.io-client'
import { SalaResumen, storeSalas } from '../stores/salas-store'

/**
 * GESTIÓN (ABM) de las salas del profe — espejo cliente de `handlersGestionSalasProfe`. La conexión
 * es token-only, sin sala abierta: acá solo van la lista y los verbos de alta/baja/modificación.
 */
export default function profeGestionSalasHandlers(socket: Socket | null) {
  const almacenSalas = storeSalas.getState()

  return {
    montar: () => {
      if (!socket) return

      // Lista de salas del profe (pantalla de gestión)
      socket.on('salas:lista', (salas: SalaResumen[]) => almacenSalas.set(salas ?? []))
    },

    acciones: {
      listarSalas: () => socket?.emit('salas:listar'),
      crearSala: (payload: { config?: Partial<ConfigCreacionSala>; nombre?: string; listaPermitidos?: string[] }) =>
        socket?.emit('sala:crear', payload),
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
