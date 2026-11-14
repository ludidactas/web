import { z } from 'zod'
import type { AsistenciaDeClase } from '../validators/asistencia'
import { comando, comandoAck, devuelve, sinPayload } from './definir'
import type { EncuestaHidratadaProfe } from '../validators/polls'
import {
  configActualizableParcial,
  crearSalaSchema,
  idSalaSchema,
  type ConfigSala,
  type EstudianteDeSala,
  type ListaPermitidosConInfo,
  type PlanillaCompleta,
  type SalaData,
  type SalaResumen,
} from '../validators/salas'
import type { WssEstudianteSession } from '../validators/session'
import { infoEntrada, type InfoEntrada } from '../validators/invitados'

/** Comandos de gestión (ABM) del profe: valen desde que conecta, sin sala abierta. */
export const comandosSalasGestion = {
  'salas:listar': comando(sinPayload),
  /** Devuelve el id de la sala nueva; el cliente navega a operarla. */
  'sala:crear': comandoAck(crearSalaSchema, devuelve<{ idSala: string }>()),
  'sala:renombrar': comando(idSalaSchema.extend({ nombre: z.string() })),
  'sala:eliminar': comandoAck(idSalaSchema, devuelve<void>()),
  'sala:abrir': comando(idSalaSchema),
}

/** Comandos de la sala abierta del profe, ligados a la sala que abrió con `sala:abrir`. */
export const comandosSalaActivaProfe = {
  'sala:actualizar_config': comando(configActualizableParcial),
  'sala:listar_estudiantes': comando(sinPayload),
  /** `minutos` acota la planilla a quienes estuvieron conectados en ese intervalo hacia atrás. */
  'sala:pedir_planilla_completa': comandoAck(z.number().optional(), devuelve<PlanillaCompleta>()),
  /** Entradas de la lista (identidad según el `metodo_login`) con su info opcional. */
  'sala:permitidos_agregar': comando(z.array(z.object({ identidad: z.string(), info: infoEntrada.optional() }))),
  'sala:permitidos_remover': comando(z.array(z.string())),
  'sala:permitidos_limpiar': comando(sinPayload),
  /** Reemplaza la info de una entrada de la lista. */
  'sala:permitidos_info': comando(z.object({ identidad: z.string(), info: infoEntrada })),
  /**
   * Quita la reserva de un nombre (identidad `nombre`) y desconecta a quien lo tenga. Con `borrarDatos`
   * borra además lo asociado al nombre: planilla, votos, datos de Go y asistencia.
   */
  'sala:liberar_nombre': comando(z.object({ nombre: z.string(), borrarDatos: z.boolean().default(false) })),
  /** Asistencias de clases cerradas que todavía no se escribieron en Drive. */
  'sala:asistencias_pendientes': comandoAck(sinPayload, devuelve<AsistenciaDeClase[]>()),
  'sala:descartar_asistencias_pendientes': comandoAck(sinPayload, devuelve<void>()),
}

/** Comando del estudiante y del cliente público: pedir la config pública de la sala. */
export const comandosSalaConfig = {
  'sala:pedir_config': comando(sinPayload),
}

/** Eventos que reciben todos los roles. */
interface EventosBase {
  'wss:error': { message: string }
  'sala:config_actualizada': ConfigSala
}

export interface EventosSalaProfe extends EventosBase {
  'salas:lista': SalaResumen[]
  'sala:abierta': {
    sala: SalaData
    polls: EncuestaHidratadaProfe[]
    estudiantes: EstudianteDeSala[]
    config: ConfigSala
    listaPermitidos: ListaPermitidosConInfo
  }
  'sala:estudiantes': EstudianteDeSala[]
  'sala:estudiante_conectado': WssEstudianteSession
  'sala:estudiante_desconectado': { id: string }
  'sala:lista_permitidos': ListaPermitidosConInfo
}

export interface EventosSalaEstudiante extends EventosBase {
  /** El server lo desconecta de la sala (fuera de la lista de invitados, sala eliminada). */
  'sala:kick': { motivo: string }
  /** Está en la lista de invitados: `info` es lo que el profe anotó de esa entrada, si anotó algo. */
  'sala:invitado': { info?: InfoEntrada }
}

export type EventosSalaPublico = EventosBase
