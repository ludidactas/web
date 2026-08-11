import { SalaData } from '@/wss/salas/app'
import type { Ack } from '@/wss/middleware/error-handling'
import { EncuestaHidratadaProfe } from '@/wss/validators/polls'
import { ConfigSala } from '@/wss/validators/salas'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { storeConfig } from '../stores/config-store'
import { storeEncuestasProfe } from '../stores/encuestas-store'
import { Estudiante, storeEstudiantes } from '../stores/estudiantes-store'
import { storePermitidos } from '../stores/permitidos-store'

/** Una fila de la planilla completa: la sesión durable del estudiante + su nombre provisto (si el
 * profe le asignó uno como invitado) + el texto de las opciones que votó en cada encuesta. */
export type FilaPlanillaCompleta = Estudiante & { nombreProvisto?: string; respuestas: Record<string, string> }

export type PlanillaCompleta = {
  preguntas: { id: string; pregunta: string }[]
  filas: FilaPlanillaCompleta[]
}

/** OPERACIÓN — espejo cliente de `handlersSalaActivaProfe`. */
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

      socket.on(
        'sala:abierta',
        ({
          polls,
          estudiantes,
          config,
          listaPermitidos,
        }: {
          sala: SalaData
          polls: EncuestaHidratadaProfe[]
          estudiantes: Estudiante[]
          config: ConfigSala
          listaPermitidos: { lista: string[]; nombres: Record<string, string> }
        }) => {
          almacenConfig.set(config)
          almacenEncuestas.set(polls)
          almacenEstudiantes.set(estudiantes)
          almacenPermitidos.set(listaPermitidos ?? { lista: [], nombres: {} })
        }
      )

      socket.on('sala:lista_permitidos', almacenPermitidos.set)

      // El server avisa (y después desconecta) cuando el profe eliminó la sala
      socket.on('sala:eliminada', () => {
        toast.success('Sala eliminada')
        almacenConfig.set(null)
        almacenEstudiantes.set([])
        almacenEncuestas.set([])
        almacenPermitidos.set({ lista: [], nombres: {} })
      })
    },

    acciones: {
      limpiarEstudiantes: () => socket?.emit('sala:limpar_estudiantes_sala'),
      actualizarConfig: (config: Partial<ConfigSala>) => socket?.emit('sala:actualizar_config', config),
      agregarPermitidos: (list: string[]) => socket?.emit('sala:permitidos_agregar', list),
      removerPermitidos: (list: string[]) => socket?.emit('sala:permitidos_remover', list),
      borrarListaPermitidos: () => socket?.emit('sala:permitidos_limpiar'),
      setNombrePermitido: (dni: string, nombre: string) => socket?.emit('sala:permitidos_nombre', { dni, nombre }),
      // Comando con ack: el caller (botón de exportar) necesita los datos ya para armar el archivo.
      pedirPlanillaCompleta: async (): Promise<PlanillaCompleta> => {
        if (!socket) throw new Error('Sin conexión')
        const res: Ack<PlanillaCompleta> = await socket.timeout(10000).emitWithAck('sala:pedir_planilla_completa')
        if (!res.ok) throw new Error(res.error)
        return res.data
      },
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('sala:abierta')
      socket.removeAllListeners('sala:lista_permitidos')
      socket.removeAllListeners('sala:estudiantes')
      socket.removeAllListeners('sala:estudiante_conectado')
      socket.removeAllListeners('sala:estudiante_desconectado')
      socket.removeAllListeners('sala:eliminada')
    },
  }
}
