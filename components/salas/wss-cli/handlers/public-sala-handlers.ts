import { Socket } from 'socket.io-client'

export default function publicSalaHandlers(socket: Socket | null) {
  return {
    montar: () => {
      if (!socket) return
    },

    acciones: {
      consultarNombreDisponible: (nombre: string) => {
        return new Promise((resolve, reject) => {
          if (!socket) {
            reject(new Error('Socket no conectado'))
            return
          }

          /** @todo PENDIENTE DE IMPLEMENTAR EN EL SERVER */
          socket.emit('sala:consultar_nombre_disponible', { nombre }, (response: { disponible: boolean }) => {
            resolve(response.disponible)
          })
        })
      },
    },

    desmontar: () => {
      if (!socket) return
    },
  }
}
