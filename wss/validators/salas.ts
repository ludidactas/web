import { z } from 'zod'
import { MetodosLogin } from './auth'

/** Data enviada al momento de crear la sala */
export const configCreacionSala = z.object({
  // Esquema de auth de la sala: la sala decide cómo se autentican los estudiantes.
  esquema: z.nativeEnum(MetodosLogin).default(MetodosLogin.Nombre),
  // Ortogonal al esquema: restringe el acceso a una lista de invitados (hoy solo con esquema 'dni').
  solo_invitados: z.boolean().default(false),
})

/** Data derivada o generada en el server */
export const configSala = configCreacionSala.extend({
  nombre_profe: z.string(),
  link: z.string(),
})

export type ConfigCreacionSala = z.input<typeof configCreacionSala>
export type ConfigSala = z.infer<typeof configSala>
