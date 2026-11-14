import { z } from 'zod'
import { AccesoSala, MetodosLogin } from './auth'
import { CONFIG_DEFAULTS, estadisticaSvgConfigValidator } from './overlay'
import { condicionAsistenciaSchema } from './asistencia'
import type { WssEstudianteSession } from './session'

/** Data enviada al momento de crear la sala */
export const configCreacionSala = z.object({
  // Nombre de la sala (opcional). Editable después con `sala:renombrar` (ver `configActualizable`).
  nombre: z.string().optional(),

  // Identidad de los estudiantes: la sala decide cómo se identifican. Inmutable.
  metodo_login: z.enum(MetodosLogin).default(MetodosLogin.Nombre),

  // A quién admite la sala, ortogonal al metodo_login. Inmutable; solo la lista es editable.
  acceso: z.enum(AccesoSala).default(AccesoSala.Libre),

  // Listado de asistencia automática
  condicion_asistencia: condicionAsistenciaSchema.nullable().optional(),

  // Lista inicial (identidades según el metodo_login), lueguito el server la extrae y la guarda en su SET (`sala:<id>:allowed_list`)
  listaPermitidos: z.array(z.string()).default([]),

  // Nombres provistos para (algunas de) las identidades de `listaPermitidos`, cargados junto con la lista
  // inicial. El server los extrae y los guarda en su hash (`sala:<id>:allowed_names`).
  nombresPermitidos: z.record(z.string(), z.string()).default({}),
})

/** Data derivada o generada en el server (lo que se persiste en el blob). */
export const configSala = configCreacionSala.omit({ listaPermitidos: true, nombresPermitidos: true }).extend({
  nombre_profe: z.string(),
  link: z.string(),
  overlay: estadisticaSvgConfigValidator.catch(CONFIG_DEFAULTS),
  condicion_asistencia: condicionAsistenciaSchema.nullable().optional().catch(null),
  guardar_partidas_drive: z.boolean().optional().catch(false),
})

/**
 * Subconjunto de la config que se puede modificar una vez creada la sala.
 * `metodo_login` y `acceso` se fijan al crear la sala.
 * (La lista se gestiona aparte, vía los comandos `sala:permitidos_*`.)
 */
export const configActualizable = configSala
  .pick({ nombre: true, overlay: true, condicion_asistencia: true, guardar_partidas_drive: true })
  .strict()

/** `configActualizable` con todos los campos opcionales: lo que el profe puede mandar para cambiar la config. */
export const configActualizableParcial = configActualizable.partial()

export const crearSalaSchema = z.object({ config: configCreacionSala.prefault({}) }).prefault({})

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

/**
 * Fila de la planilla exportada. Los datos de identidad vienen de la sesión del estudiante; en una sala
 * con lista, quien figura en ella y nunca ingresó tiene una fila con `asistio: false` y solo su
 * identidad y su nombre provisto.
 */
export type FilaPlanillaCompleta = {
  userId: string
  nombre?: string
  dni?: string
  email?: string
  nombreProvisto?: string
  /** Pasó por la sala (y, si la planilla se acotó a una ventana, estuvo conectado en ella). */
  asistio: boolean
  /** Texto de lo que votó en cada encuesta, por id de encuesta. */
  respuestas: Record<string, string>
}

export type PlanillaCompleta = {
  preguntas: { id: string; pregunta: string }[]
  filas: FilaPlanillaCompleta[]
}

/** Lista de una sala (identidades según su `metodo_login`) con los nombres que el profe les asignó. */
export type ListaPermitidosConNombres = { lista: string[]; nombres: Record<string, string> }

export type SalaResumen = { id: string; nombre?: string; metodo_login: MetodosLogin; acceso: AccesoSala }
