import { comandosSalaActivaProfe, EventosSalaProfe } from '@/wss/contrato/salas'
import { ConfigActualizableParcial, PlanillaCompleta } from '@/wss/validators/salas'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { comandos, escuchar } from '../contrato-cli'
import { storeConfig } from '../stores/config-store'
import { storeEncuestasProfe } from '../stores/encuestas-store'
import { storeEstudiantes } from '../stores/estudiantes-store'
import { storePermitidos } from '../stores/permitidos-store'

/** OPERACIÓN — espejo cliente de `handlersSalaActivaProfe`. */
export default function profeSalaActivaHandlers(socket: Socket | null) {
  const almacenEncuestas = storeEncuestasProfe.getState()
  const almacenEstudiantes = storeEstudiantes.getState()
  const almacenConfig = storeConfig.getState()
  const almacenPermitidos = storePermitidos.getState()
  const cmd = comandos<typeof comandosSalaActivaProfe>(socket)
  // La planilla recorre encuestas y estudiantes de la sala: tarda más que un comando común.
  const cmdLento = comandos<typeof comandosSalaActivaProfe>(socket, { timeoutMs: 10_000 })

  return {
    montar: () =>
      escuchar<EventosSalaProfe>(socket, {
        'sala:estudiantes': almacenEstudiantes.set,

        'sala:estudiante_conectado': (estudiante) => {
          toast.success(`Estudiante conectado: ${estudiante.nombre}`)
          almacenEstudiantes.add({ ...estudiante, conectado: true })
        },

        'sala:estudiante_desconectado': (estudiante) => almacenEstudiantes.disconnect(estudiante.id),

        'sala:abierta': ({ polls, estudiantes, config, listaPermitidos }) => {
          almacenConfig.set(config)
          almacenEncuestas.set(polls)
          almacenEstudiantes.set(estudiantes)
          almacenPermitidos.set(listaPermitidos ?? { lista: [], nombres: {} })
        },

        'sala:lista_permitidos': almacenPermitidos.set,
      }),

    acciones: {
      actualizarConfig: (config: ConfigActualizableParcial) => cmd.enviar('sala:actualizar_config', config),
      agregarPermitidos: (list: string[]) => cmd.enviar('sala:permitidos_agregar', list),
      removerPermitidos: (list: string[]) => cmd.enviar('sala:permitidos_remover', list),
      borrarListaPermitidos: () => cmd.enviar('sala:permitidos_limpiar'),
      setNombrePermitido: (dni: string, nombre: string) => cmd.enviar('sala:permitidos_nombre', { dni, nombre }),
      // Comando con ack: el caller (botón de exportar) necesita los datos ya para armar el archivo.
      // `minutos`, si viene, acota la planilla a quienes estuvieron conectados en ese intervalo hacia
      // atrás (para acotar la exportación a la clase actual).
      pedirPlanillaCompleta: (minutos?: number): Promise<PlanillaCompleta> =>
        cmdLento.pedir('sala:pedir_planilla_completa', minutos),
    },
  }
}
