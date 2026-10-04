import { z } from 'zod'

export const MAX_RESUELTOS_SINCRONIZAR = 500

export const FORMATO_ID_DOJO = /^[0-9a-f]{32}$/

export const identificarseDojoSchema = z.object({
  idDojo: z.string().max(64).optional(),
})

const capituloSchema = z.string().regex(/^[a-z0-9-]{1,64}$/)
const desafioSchema = z.string().min(1).max(128)

export const sincronizarDojoSchema = z.object({
  capitulo: capituloSchema,
  resueltos: z.array(desafioSchema).max(MAX_RESUELTOS_SINCRONIZAR),
})

export const desafioDojoSchema = z.object({
  capitulo: capituloSchema,
  desafio: desafioSchema,
})

export type ProgresoDojoRemoto = { resueltos: string[]; actual: string | null }
