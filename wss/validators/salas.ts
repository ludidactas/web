import { z } from 'zod'
import { MetodosLogin } from './auth'
import { CONFIG_DEFAULTS, estadisticaSvgConfigValidator } from './overlay'

/** Data enviada al momento de crear la sala */
export const configCreacionSala = z.object({
  // Nombre de la sala (opcional). Editable después con `sala:renombrar` (ver `configActualizable`).
  nombre: z.string().optional(),

  // Método de login de la sala: la sala decide cómo se autentican los estudiantes.
  metodo_login: z.nativeEnum(MetodosLogin).default(MetodosLogin.Nombre),

  // Ortogonal al metodo_login: restringe el acceso a una lista de invitados.
  solo_invitados: z.boolean().default(false),
  
  // Lista de invitados inicial, lueguito el server la extrae y la guarda en su SET (`sala:<id>:allowed_list`)
  listaPermitidos: z.array(z.string()).default([]),
})

/** Data derivada o generada en el server (lo que se persiste en el blob). */
export const configSala = configCreacionSala.omit({ listaPermitidos: true }).extend({
  nombre_profe: z.string(),
  link: z.string(),
  // Config del visualizador (overlay). El `.catch` cubre salas viejas sin este campo: caen al default.
  overlay: estadisticaSvgConfigValidator.catch(CONFIG_DEFAULTS),
})

/**
 * Subconjunto de la config que se puede modificar una vez creada la sala.
 * El `metodo_login` es inmutable: se fija al crear la sala y no se cambia más.
 * (La lista de invitados se gestiona aparte, vía los eventos `sala:permitidos_*`.)
 */
export const configActualizable = configSala.pick({ solo_invitados: true, nombre: true, overlay: true }).strict()

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
