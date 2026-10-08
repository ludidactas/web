import { EventosSalaEstudiante } from '@/wss/contrato/salas'
import { Socket } from 'socket.io-client'

import { toast } from 'sonner'
import { escuchar } from '../contrato-cli'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { storeInvitado } from '../stores/invitado-store'

export default function estudianteSalaHandlers(socket: Socket | null) {
  const { setIngresado } = storeEstudianteLogin.getState()

  let dejarDeEscuchar = () => {}

  return {
    montar: () => {
      dejarDeEscuchar = escuchar<EventosSalaEstudiante>(socket, {
        // Si nos kickean, volver al login
        'sala:kick': ({ motivo }) => {
          console.log('wss-cli sala:kick: fuimos kickeados por:', motivo)
          toast.error(motivo)

          const idSala = (socket?.auth as any)?.idSala as string
          if (idSala !== null) {
            setIngresado(false) //Esto no es suficiente, necesitamos modificar el localStorage para que el login page se de cuenta que no estamos ingresados. Logica con potencial de mejora.
            localStorage.setItem(`encuestas-ingresado-${idSala}`, '0')
          } else {
            console.log(' Error: el socket no contiene informacion de la sala')
          }
        },

        // El toast usa el nombre que puso el profe (prueba de que la asistencia matcheó la lista), no el tipeado; si falta, el DNI.
        'sala:invitado': ({ nombreProvisto }) => {
          storeInvitado.getState().set({ nombreProvisto })
          const { dni } = storeEstudianteLogin.getState()
          toast.success(`Asistencia tomada de ${nombreProvisto || dni}`)
        },
      })
    },

    acciones: {},

    desmontar: () => dejarDeEscuchar(),
  }
}
