import { z } from "zod"

export const configSala = z.object({
  pedir_dni: z.boolean(),
  permitir_anonimo: z.boolean(),
  // invitados: string[] // emails permitidos a entrar
  nombre_profe: z.string(),
})

export type ConfigSala = z.infer<typeof configSala>