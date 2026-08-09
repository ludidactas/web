import { Socket } from 'socket.io-client'

import { toast } from 'sonner'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { storeInvitado } from '../stores/invitado-store'

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

      // El server nos avisa que estamos en la lista de invitados de la sala (con nuestro nombre
      // provisto, si el profe nos puso uno) para mostrar el aviso y tomar asistencia. El toast usa
      // el nombre provisto por el profe (es la prueba de que la asistencia matcheó contra la lista),
      // nunca el nombre que tipeó el estudiante; si el profe no le puso nombre, cae al DNI.
      socket.on('sala:invitado', ({ nombreProvisto }: { nombreProvisto?: string }) => {
        storeInvitado.getState().set({ nombreProvisto })
        const { dni } = storeEstudianteLogin.getState()
        toast.success(`Asistencia tomada de ${nombreProvisto || dni}`)
      })
    },

    acciones: {},

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:kick')
      socket.removeAllListeners('sala:invitado')
    },
  }
}
