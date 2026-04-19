import { Socket } from 'socket.io-client'

import { toast } from 'sonner'
import { ConfigSala } from '@/wss/validators/salas'
import { storeConfig } from '../stores/config-store'

export default function baseSalaHandlers(socket: Socket | null) {
  const { set: setConfig } = storeConfig.getState()

  return {
    montar: () => {
      if (!socket) return

      // Registramos el listener ANTES de pedirla para evitar race condition
      socket.on('sala:config_actualizada', (config: ConfigSala) => {
        toast.success(`Configuración actualizada!`)
        setConfig(config)
      })

      // Al recibir un error, mostrarlo con un toast
      socket.on('wss:error', ({ message }: { message: string }) => {
        toast.error(message)
      })

      // Pedimos la config ahora que el listener ya está registrado
      socket.emit('sala:pedir_config')
    },

    acciones: {},

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:config_actualizada')
      socket.removeAllListeners('wss:error')
    },
  }
}
