import { isEmpty } from 'remeda'
import z from 'zod'

/**
 * La definimos como tipo para conservar los docstrings.
 * El serializador de zod conforma a esta interfaz.
 */
interface EncuestaConDocstrings {
  id: string
  pregunta: string
  opciones: Opcion[]
  /** Fecha y hora de creación */
  createdAt: string
  /** Define si está abierta, es decir si recibe votos */
  isOpen: boolean
  /** Define si está publicada, es decir si es visible para lxs estudiantes */
  isPublished: boolean
  /** Define se está enfocada en el overlay */
  isFocused: boolean
  /** Define si los votos y las opciones son visibles en el overlay y la vista de estudiante */
  isRevealed: boolean
  /** Define si una encuesta puede recibir respuestas adicionales a las opciones dadas */
  admiteAportes: boolean
  /** Define si se pueden seleccionar varias respuestas para esta pregunta */
  admiteMultiplesVotos: boolean
  /** Define el máximo de repuestas que se pueden elegir */
  maxMultiplesVotos: number | null
}

const textoOpcion = z
  .string()
  .trim()
  .min(1, 'El texto de la opción no puede estar vacío')
  .max(1400, 'El texto de la opción no puede superar los 1400 caracteres')

const opcionSchema = z.object({
  id: z.string(),
  texto: textoOpcion,
  votos: z.number(),
})

const encuestaBase = z.object({
  id: z.string(),
  pregunta: z.string(),
  opciones: z.array(opcionSchema),
  createdAt: z.string(),
  isOpen: z.boolean(),
  isPublished: z.boolean(),
  isFocused: z.boolean(),
  isRevealed: z.boolean(),
  admiteAportes: z.boolean(),
  admiteMultiplesVotos: z.boolean(),
  maxMultiplesVotos: z.number().nullable(),
})

export const encuestaSchema: z.ZodType<EncuestaConDocstrings> = encuestaBase

export const encuestaHidratadaSchema = encuestaBase.extend({
  puedoVotar: z.boolean().optional(),
  votosEmitidos: z.array(z.string()).optional(),
})

export const crearEncuesta = z
  .object({
    pregunta: z.string().min(1, 'La pregunta es obligatoria'),
    opciones: z.array(textoOpcion),
    admiteAportes: z.boolean().default(false),
    admiteMultiplesVotos: z.boolean().default(false),
    maxMultiplesVotos: z.number().nullable().default(null),
  })
  .refine((datos) => datos.admiteAportes || datos.opciones.length >= 2, {
    message: 'La pregunta debe tener al menos dos opciones o admitir aportes de los participantes',
  })
  .refine((datos) => !datos.opciones.some(isEmpty), {
    message: 'Las opciones no pueden estar vacías',
  })

const voteBase = z.object({
  pollId: z.string().min(1, 'El ID de la encuesta es obligatorio'),
})

export const voteValidator = z.discriminatedUnion('tipo', [
  voteBase.extend({ tipo: z.literal('opcion'), optionId: z.string().min(1) }),
  voteBase.extend({ tipo: z.literal('aporte'), aporte: z.string().min(1) }),
])

export const nuevaEncuesta = crearEncuesta.transform((data) => ({
  ...data,
  opciones: data.opciones.map((opc, i): Opcion => ({ id: i.toString(), texto: opc, votos: 0 })),
  isOpen: true,
  isPublished: true,
  isFocused: false, // @todo Enfocar por default al crear
  isRevealed: false,
}))

export type Encuesta = z.infer<typeof encuestaSchema>
export type CrearEncuesta = z.infer<typeof crearEncuesta>
export type VotarEncuesta = z.infer<typeof voteValidator>
export type Opcion = z.infer<typeof opcionSchema>
export type EncuestaHidratada = z.infer<typeof encuestaHidratadaSchema>
