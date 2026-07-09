import { ConfigCreacionSala } from '@/wss/validators/salas'
import { Socket } from 'socket.io-client'
import { storeConfig } from '../stores/config-store'
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

      // Sala recién creada: guardamos su id para que el form de creación pueda navegar a operarla.
      socket.on('sala:creada', ({ idSala }: { idSala: string }) => storeConfig.getState().setIdSala(idSala))
    },

    acciones: {
      listarSalas: () => socket?.emit('salas:listar'),
      crearSala: (payload: { config?: ConfigCreacionSala }) => socket?.emit('sala:crear', payload),
      renombrarSala: (idSala: string, nombre: string) => socket?.emit('sala:renombrar', { idSala, nombre }),
      eliminarSala: (idSala: string) => socket?.emit('sala:eliminar', { idSala }),
      abrirSala: (idSala: string) => socket?.emit('sala:abrir', { idSala }),
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('salas:lista')
      socket.removeAllListeners('sala:creada')
    },
  }
}
