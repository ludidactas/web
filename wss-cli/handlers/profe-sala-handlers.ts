import { SalaData } from '@/wss/salas/app'
import { EncuestaConVotos } from '@/wss/validators/polls'
import { ConfigSala } from '@/wss/validators/salas'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { Estudiante, storeEstudiantes } from '../stores/estudiantes-store'
import { storeEncuestas } from '../stores/encuestas-store'
import { storeConfig } from '../stores/config-store'

export default function profeSalaHandlers(socket: Socket | null) {
  const almacenEncuestas = storeEncuestas.getState()
  const almacenEstudiantes = storeEstudiantes.getState()
  const almacenConfig = storeConfig.getState()

  return {
    montar: () => {
      if (!socket) return

      // Al recibir estudiantes los almacenamos en el store
      socket.on('sala:estudiantes', almacenEstudiantes.set)

      // Al conectar o desconectar estudiantes...
      socket.on('sala:estudiante_conectado', (estudiante: Estudiante) => {
        toast.success(`Estudiante conectado: ${estudiante.nombre}`)
        almacenEstudiantes.add(estudiante)
      })

      socket.on('sala:estudiante_desconectado', (estudiante: { id: string }) => {
        almacenEstudiantes.disconnect(estudiante.id)
      })

      // Al estar lista la sala -- esto manda el server ni bien abre
      socket.on(
        'sala:abierta',
        ({
          _sala,
          polls,
          estudiantes,
          config,
        }: {
          _sala: SalaData
          polls: EncuestaConVotos[]
          estudiantes: Estudiante[]
          config: ConfigSala
        }) => {
          toast.info(`Sala abierta, podés compartirla con tus estudiantes!`)
          almacenConfig.set(config)
          almacenEncuestas.set(polls)
          almacenEstudiantes.set(estudiantes)
        }
      )
    },

    acciones: {
      limpiarEstudiantes: () => socket?.emit('sala:limpar_estudiantes_sala'),

      actualizarConfig: (config: Partial<ConfigSala>) => {
        socket?.emit('sala:actualizar_config', config)
      },
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:abierta')
      socket.removeAllListeners('sala:estudiantes')
      socket.removeAllListeners('sala:estudiante_conectado')
      socket.removeAllListeners('sala:estudiante_desconectado')
    },
  }
}
