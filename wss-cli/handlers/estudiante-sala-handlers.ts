import { Socket } from 'socket.io-client'

import { toast } from 'sonner'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'

export default function estudianteSalaHandlers(socket: Socket | null) {
  const { setIngresado } = storeEstudianteLogin.getState()

  return {
    montar: () => {
      if (!socket) return

      // Si nos kickean, volver al login
      socket.on('sala:kick', ({ motivo }) => {
        toast.error(motivo)
        socket.disconnect()
        setIngresado(false)
      })
    },

    acciones: {},

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:kick')
    },
  }
}
