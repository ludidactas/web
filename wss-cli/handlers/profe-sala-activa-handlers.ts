import { SalaData } from '@/wss/salas/app'
import { EncuestaHidratadaProfe } from '@/wss/validators/polls'
import { ConfigSala } from '@/wss/validators/salas'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { storeConfig } from '../stores/config-store'
import { storeEncuestasProfe } from '../stores/encuestas-store'
import { Estudiante, storeEstudiantes } from '../stores/estudiantes-store'
import { storePermitidos } from '../stores/permitidos-store'

/**
 * OPERACIÓN de la sala activa — espejo cliente de `handlersSalaActivaProfe`. Hidrata el estado de la
 * sala al abrirla (`sala:abierta`) y expone las acciones que operan sobre ella (config, estudiantes,
 * permitidos).
 */
export default function profeSalaActivaHandlers(socket: Socket | null) {
  const almacenEncuestas = storeEncuestasProfe.getState()
  const almacenEstudiantes = storeEstudiantes.getState()
  const almacenConfig = storeConfig.getState()
  const almacenPermitidos = storePermitidos.getState()

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

      // Al abrir una sala -- el server lo manda tras `sala:abrir` o `sala:crear`
      socket.on(
        'sala:abierta',
        ({
          sala,
          polls,
          estudiantes,
          config,
          listaPermitidos,
        }: {
          sala: SalaData
          polls: EncuestaHidratadaProfe[]
          estudiantes: Estudiante[]
          config: ConfigSala
          listaPermitidos: string[]
        }) => {
          almacenConfig.setIdSala(sala.id)
          almacenConfig.set(config)
          almacenEncuestas.set(polls)
          almacenEstudiantes.set(estudiantes)
          almacenPermitidos.set(listaPermitidos ?? [])
        }
      )

      socket.on('sala:lista_permitidos', almacenPermitidos.set)
    },

    acciones: {
      limpiarEstudiantes: () => socket?.emit('sala:limpar_estudiantes_sala'),
      actualizarConfig: (config: Partial<ConfigSala>) => socket?.emit('sala:actualizar_config', config),
      agregarPermitidos: (list: string[]) => socket?.emit('sala:permitidos_agregar', list),
      removerPermitidos: (list: string[]) => socket?.emit('sala:permitidos_remover', list),
      borrarListaPermitidos: () => socket?.emit('sala:permitidos_limpiar'),
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:abierta')
      socket.removeAllListeners('sala:lista_permitidos')
      socket.removeAllListeners('sala:estudiantes')
      socket.removeAllListeners('sala:estudiante_conectado')
      socket.removeAllListeners('sala:estudiante_desconectado')
    },
  }
}
