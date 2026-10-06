import { ConfigCreacionSala } from '@/wss/validators/salas'
import { comandosSalasGestion, EventosSalaProfe } from '@/wss/contrato/salas'
import { Socket } from 'socket.io-client'
import { comandos, escuchar } from '../contrato-cli'
import { storeSalas } from '../stores/salas-store'

/** GESTIÓN (ABM) — espejo cliente de `handlersGestionSalasProfe`. */
export default function profeGestionSalasHandlers(socket: Socket | null) {
  const almacenSalas = storeSalas.getState()
  const cmd = comandos<typeof comandosSalasGestion>(socket)

  let dejarDeEscuchar = () => {}

  return {
    montar: () => {
      dejarDeEscuchar = escuchar<EventosSalaProfe>(socket, {
        'salas:lista': (salas) => almacenSalas.set(salas ?? []),
      })
    },

    acciones: {
      listarSalas: () => cmd.enviar('salas:listar'),
      // Comando con ack: resuelve con el id de la sala nueva para que el form navegue a operarla.
      crearSala: async (payload: { config?: ConfigCreacionSala }): Promise<string> =>
        (await cmd.pedir('sala:crear', payload)).idSala,
      renombrarSala: (idSala: string, nombre: string) => cmd.enviar('sala:renombrar', { idSala, nombre }),
      // Comando con ack: el caller espera la confirmación antes de sacarla de la lista/UI.
      eliminarSala: (idSala: string) => cmd.pedir('sala:eliminar', { idSala }),
      abrirSala: (idSala: string) => cmd.enviar('sala:abrir', { idSala }),
    },

    desmontar: () => dejarDeEscuchar(),
  }
}
