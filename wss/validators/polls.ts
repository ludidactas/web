import { isEmpty } from 'remeda'
import z from 'zod'

/**
 * La definimos como tipo para conservar los docstrings.
 * El serializador de zod `encuestaSchema` conforma a esta interfaz.
 */
interface _Encuesta {
  /** Id estático generado por el server */
  id: string
  /** Texto de la pregunta */
  pregunta: string
  /** Lista de opciones de respuesta para esta pregunta */
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

const texto = (de_que: string) =>
  z
    .string()
    .trim()
    .min(1, `El texto de la ${de_que} no puede estar vacío`)
    .max(1400, `El texto de la ${de_que} no puede superar los 1400 caracteres`)

const textoOpcion = texto('opción')
const textoPregunta = texto('pregunta')

const opcionSchema = z.object({
  id: z.string(),
  texto: textoOpcion,
})

/** Opción con vantidad de votos */
const opcionConCantidadVotos = opcionSchema.extend({ votos: z.number() })

/** Opción con la lista de votantes */
const opcionConVotantes = opcionConCantidadVotos.extend({ votantes: z.array(z.string()) })

const encuestaBase = z.object({
  id: z.string(),
  pregunta: textoPregunta,
  opciones: z.array(opcionSchema),
  createdAt: z.string(),
  isOpen: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  isFocused: z.boolean().default(false),
  isRevealed: z.boolean().default(false),
  admiteAportes: z.boolean().default(false),
  admiteMultiplesVotos: z.boolean().default(false),
  maxMultiplesVotos: z.number().nullable().default(null),
})

export const encuestaSchema: z.ZodType<_Encuesta, z.ZodTypeDef, unknown> = encuestaBase

/** Encuesta con votos, es decir hidratada para el público general */
const encuestaConVotos = encuestaBase.extend({
  opciones: z.array(opcionConCantidadVotos),
})

/** Encuesta con votantes, solo para el profe */
const encuestaConVotantes = encuestaBase.extend({
  opciones: z.array(opcionConVotantes),
})

export const encuestaHidratadaEstudiante = encuestaConVotos.extend({
  puedoVotar: z.boolean().optional(),
  votosEmitidos: z.array(z.string()).optional(),
})

export const encuestaHidratadaProfe = encuestaConVotantes

export const crearEncuesta = z
  .object({
    pregunta: textoPregunta,
    opciones: z.array(textoOpcion),
    admiteAportes: z.boolean().default(false),
    admiteMultiplesVotos: z.boolean().default(false),
    maxMultiplesVotos: z.number().nullable().default(null),
    isOpen: z.boolean().default(false),
    isPublished: z.boolean().default(false),
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
  opciones: data.opciones.map((opc, i): Opcion => ({ id: i.toString(), texto: opc })),
  isFocused: false, // @todo Enfocar por default al crear
  isRevealed: false,
}))

/** Tipo Encuesta almacenado en el server: tiene los flags de config y las opciones pero no votos */
export type Encuesta = z.infer<typeof encuestaSchema>

/** Encuesta hidratada con votos para mostrarla en el frontend */
export type EncuestaConVotos = z.infer<typeof encuestaConVotos>

/** Encuesta hidratada con información de user (ya voté? qué opción? puedo serguir votando? etc) */
export type EncuestaHidratadaEstudiante = z.infer<typeof encuestaHidratadaEstudiante>

/** Encuesta hidratada con información de profe (quién votó cada opción?) */
export type EncuestaHidratadaProfe = z.infer<typeof encuestaHidratadaProfe>

/** Form de creación de encuesta (y validador en el server) */
export type CrearEncuesta = z.infer<typeof crearEncuesta>

/** Info de un voto */
export type VotarEncuesta = z.infer<typeof voteValidator>

/** Opción dentro de la encuesta, solo info base */
export type Opcion = z.infer<typeof opcionSchema>

/** Opción con info de votos */
export type OpcionConVotos = z.infer<typeof opcionConCantidadVotos>
