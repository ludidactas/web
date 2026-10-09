import { z } from 'zod'
import { MetodosLogin } from './auth'
import { CONFIG_DEFAULTS, estadisticaSvgConfigValidator } from './overlay'
import { condicionAsistenciaSchema } from './asistencia'
import type { WssEstudianteSession } from './session'

/** Data enviada al momento de crear la sala */
export const configCreacionSala = z.object({
  // Nombre de la sala (opcional). Editable después con `sala:renombrar` (ver `configActualizable`).
  nombre: z.string().optional(),

  // Método de login de la sala: la sala decide cómo se autentican los estudiantes.
  metodo_login: z.nativeEnum(MetodosLogin).default(MetodosLogin.Nombre),

  // Ortogonal al metodo_login: restringe el acceso a una lista de invitados.
  solo_invitados: z.boolean().default(false),

  // Listado de asistencia automática
  condicion_asistencia: condicionAsistenciaSchema.nullable().optional(),

  // Lista de invitados inicial, lueguito el server la extrae y la guarda en su SET (`sala:<id>:allowed_list`)
  listaPermitidos: z.array(z.string()).default([]),

  // Nombres provistos para (algunos de) los DNIs de `listaPermitidos`, cargados junto con la lista
  // inicial. El server los extrae y los guarda en su hash (`sala:<id>:allowed_names`).
  nombresPermitidos: z.record(z.string(), z.string()).default({}),
})

/** Data derivada o generada en el server (lo que se persiste en el blob). */
export const configSala = configCreacionSala.omit({ listaPermitidos: true, nombresPermitidos: true }).extend({
  nombre_profe: z.string(),
  link: z.string(),
  overlay: estadisticaSvgConfigValidator.catch(CONFIG_DEFAULTS),
  condicion_asistencia: condicionAsistenciaSchema.nullable().optional().catch(null),
})

/**
 * Subconjunto de la config que se puede modificar una vez creada la sala.
 * El `metodo_login` es inmutable: se fija al crear la sala y no se cambia más.
 * (La lista de invitados se gestiona aparte, vía los eventos `sala:permitidos_*`.)
 */
export const configActualizable = configSala
  .pick({ solo_invitados: true, nombre: true, overlay: true, condicion_asistencia: true })
  .strict()

/** `configActualizable` con todos los campos opcionales: lo que el profe puede mandar para cambiar la config. */
export const configActualizableParcial = configActualizable.partial()

export const crearSalaSchema = z.object({ config: configCreacionSala.default({}) }).default({})

export const idSalaSchema = z.object({ idSala: z.string().min(1) })

/** La data completa de una sala tal como se persiste en redis. */
export const salaData = z.object({
  id: z.string(),
  profe: z.object({
    email: z.string(),
    nombre: z.string().optional(),
  }),
  config: configSala,
})

export type ConfigCreacionSala = z.input<typeof configCreacionSala>
export type ConfigSala = z.infer<typeof configSala>
export type ConfigActualizable = z.infer<typeof configActualizable>
export type SalaData = z.infer<typeof salaData>

export type ConfigActualizableParcial = z.infer<typeof configActualizableParcial>

// `WssEstudianteSession` es una unión por método de login: `dni`, `email` y `avatar` se suman como opcionales
// para leerlos sin discriminar.
/** Estudiante de la planilla de la sala, tal como lo ve el profe. */
export type EstudianteDeSala = WssEstudianteSession & {
  conectado: boolean
  dni?: string
  email?: string
  avatar?: string
  votos?: Record<string, string[]>
}

/** Fila de la planilla: el estudiante, su nombre provisto (si es invitado) y el texto de lo que votó en cada encuesta. */
export type FilaPlanillaCompleta = EstudianteDeSala & { nombreProvisto?: string; respuestas: Record<string, string> }

export type PlanillaCompleta = {
  preguntas: { id: string; pregunta: string }[]
  filas: FilaPlanillaCompleta[]
}

/** Lista de invitados de una sala (DNIs) con los nombres que el profe les asignó. */
export type ListaPermitidosConNombres = { lista: string[]; nombres: Record<string, string> }

export type SalaResumen = { id: string; nombre?: string }
