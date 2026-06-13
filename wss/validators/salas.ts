import { z } from 'zod'

export const configCreacionSala = z.object({
  pedir_dni: z.boolean().default(false),
  permitir_anonimo: z.boolean().default(true),
  solo_invitados: z.boolean().default(false),
})

export const configSala = configCreacionSala.extend({
  nombre_profe: z.string(),
  link: z.string(),
})

export type ConfigCreacionSala = z.input<typeof configCreacionSala>
export type ConfigSala = z.infer<typeof configSala>
