import { ConfigSala } from "@/wss/validators/salas"
import { Socket } from "socket.io-client"
import { toast } from "sonner"
import { storeConfig } from "../stores/config-store"

export default function baseSalaHandlers(socket: Socket | null) {
  const { set: setConfig } = storeConfig.getState()
  
  return ({
    setupSocketListeners: () => {
      if (!socket) return

      // Al recibir la configuración actualizada, mostrar un toast y actualizar el state
      socket.on('sala:config_actualizada', (config: ConfigSala) => {
        toast.success(`Configuración actualizada!`)
        setConfig(config)
      })

      // Al recibir un error, mostrarlo con un toast
      socket.on('wss:error', ({ message }: { message: string }) => {
        toast.error(message)
      })
    },

    acciones: {}, 

    clearSocketListeners: () => {
      if (!socket) return

      socket.removeAllListeners('sala:config_actualizada')
      socket.removeAllListeners('wss:error')
    }
  })
}
