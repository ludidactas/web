import { z } from 'zod'

export const MAX_RESUELTOS_SINCRONIZAR = 500

export const FORMATO_ID_DOJO = /^[0-9a-f]{32}$/

const coleccionSchema = z.string().regex(/^[a-z0-9-]{1,32}$/)
const capituloSchema = z.string().regex(/^[a-z0-9-]{1,64}$/)
const desafioSchema = z.string().min(1).max(128)

/** Un capítulo de una colección de desafíos: la unidad sobre la que se guarda y sincroniza el progreso. */
export const capituloDojoSchema = z.object({
  coleccion: coleccionSchema,
  capitulo: capituloSchema,
})

export const sincronizarDojoSchema = capituloDojoSchema.extend({
  resueltos: z.array(desafioSchema).max(MAX_RESUELTOS_SINCRONIZAR),
})

export const desafioDojoSchema = capituloDojoSchema.extend({
  desafio: desafioSchema,
})

export type CapituloDojo = z.infer<typeof capituloDojoSchema>
export type ProgresoDojoRemoto = { resueltos: string[]; actual: string | null }
