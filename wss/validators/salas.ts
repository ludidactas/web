import { z } from 'zod'
import { MetodosLogin } from './auth'

/** Data enviada al momento de crear la sala */
export const configCreacionSala = z.object({
  // Nombre de la sala (opcional). Editable después con `sala:renombrar` (ver `configActualizable`).
  nombre: z.string().optional(),
  // Método de login de la sala: la sala decide cómo se autentican los estudiantes.
  metodo_login: z.nativeEnum(MetodosLogin).default(MetodosLogin.Nombre),
  // Ortogonal al metodo_login: restringe el acceso a una lista de invitados (hoy solo con metodo_login 'dni').
  solo_invitados: z.boolean().default(false),
})

/** Data derivada o generada en el server */
export const configSala = configCreacionSala.extend({
  nombre_profe: z.string(),
  link: z.string(),
})

/**
 * Subconjunto de la config que se puede modificar una vez creada la sala.
 * El `metodo_login` es inmutable: se fija al crear la sala y no se cambia más.
 * (La lista de invitados se gestiona aparte, vía los eventos `sala:permitidos_*`.)
 */
export const configActualizable = configSala.pick({ solo_invitados: true, nombre: true }).strict()

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
