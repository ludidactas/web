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
        console.log('wss-cli sala:kick: fuimos kickeados por:', motivo)
        toast.error(motivo)

        const idSala = (socket?.auth as any)?.idSala as string 
        if (idSala !== null) {
          setIngresado(false) //Esto no es suficiente, necesitamos modificar el localStorage para que el login page se de cuenta que no estamos ingresados. Logica con potencial de mejora.
          localStorage.setItem(`encuestas-ingresado-${idSala}`, '0')
        } else {
          console.log(' Error: el socket no contiene informacion de la sala')
        }
      })
    },

    acciones: {},

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:kick')
    },
  }
}
