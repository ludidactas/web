import { isEmpty } from 'remeda'
import z from 'zod'

export const pollBase = z
  .object({
    pregunta: z.string().min(1, 'La pregunta es obligatoria'),
    opciones: z.array(z.string()),
    admiteAportes: z.boolean().default(false),
    admiteMultiplesVotos: z.boolean().default(false),
    maxMultiplesVotos: z.number().nullable().default(null),
  })
  .refine((datos) => datos.admiteAportes || datos.opciones.filter((op) => op.trim().length > 0).length >= 2, {
    message: 'La pregunta debe tener al menos dos opciones o admitir aportes de los participantes',
  })
  .refine((datos) => !datos.opciones.some(isEmpty), {
    message: 'Las opciones no pueden estar vacías',
  })

export type CrearEncuesta = z.infer<typeof pollBase>

const voteBase = z.object({
  pollId: z.string().min(1, 'El ID de la encuesta es obligatorio'),
})

export const voteValidator = z.discriminatedUnion('tipo', [
  voteBase.extend({ tipo: z.literal('opcion'), optionId: z.string().min(1) }),
  voteBase.extend({ tipo: z.literal('aporte'), aporte: z.string().min(1) }),
])

export type VotarEncuesta = z.infer<typeof voteValidator>
