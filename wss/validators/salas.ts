import { z } from 'zod'

export const configSala = z.object({
  pedir_dni: z.boolean(),
  permitir_anonimo: z.boolean(),
  nombre_profe: z.string(),
  link: z.string(),
})

export type ConfigSala = z.infer<typeof configSala>
