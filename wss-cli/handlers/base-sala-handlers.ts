import { Socket } from 'socket.io-client'

import { toast } from 'sonner'
import { comandosSalaConfig, EventosSalaPublico } from '@/wss/contrato/salas'
import { comandos, escuchar } from '../contrato-cli'
import { storeConfig } from '../stores/config-store'

export default function baseSalaHandlers(socket: Socket | null) {
  const { set: setConfig } = storeConfig.getState()
  const cmd = comandos<typeof comandosSalaConfig>(socket)

  let dejarDeEscuchar = () => {}

  return {
    montar: () => {
      if (!socket) return

      // Registramos los listeners ANTES de pedir la config para evitar race condition
      dejarDeEscuchar = escuchar<EventosSalaPublico>(socket, {
        'sala:config_actualizada': (config) => {
          // toast.success(`Configuración actualizada!`)
          setConfig(config)
        },

        // Al recibir un error, mostrarlo con un toast
        'wss:error': ({ message }) => {
          console.warn('wss error completo:', { message })
          toast.error(message)
        },
      })

      // Pedimos la config ahora que el listener ya está registrado
      /**  @todo : Esto está introduciendo otro bug en el que cualquier intento de reconexión vuelve a pedir la config y se la vuelve a mostrar al usuario como "actualizada". */
      cmd.enviar('sala:pedir_config')
    },

    acciones: {},

    desmontar: () => dejarDeEscuchar(),
  }
}
