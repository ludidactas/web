import { z } from 'zod'

export enum FormaEvaluacionAsistencia {
  UltimosMinutos = 'ultimos_minutos',
  TotalMinutos = 'total_minutos',
}

/** Etiquetas de las formas de evaluación, para los selects del FE. */
export const ETIQUETAS_FORMA_DE_EVALUACION: Record<FormaEvaluacionAsistencia, string> = {
  [FormaEvaluacionAsistencia.UltimosMinutos]: 'Conectado los últimos',
  [FormaEvaluacionAsistencia.TotalMinutos]: 'Conectado un total de',
}

// Los únicos umbrales (en minutos) que acepta la condición: son los que ofrece el select del FE.
export const MINUTOS_MINIMOS_VALIDOS = [15, 30, 45, 60, 90, 120] as const

/**
 * Condición de asistencia de la sala. Vive acá (y no en el FE) porque la validan el server
 * al crear/actualizar la sala y `getSala` al leerla de redis, y la consume el evaluador
 * (`wss/asistencia/evaluacion.ts`): es la fuente única de verdad para los tres lados.
 */
export const condicionAsistenciaSchema = z.object({
  // `ultimos_minutos`: hay que estar conectado la ventana final de la clase.
  // `total_minutos`: alcanza con acumular esa cantidad en toda la clase (puede ser en tramos).
  forma_evaluacion: z.nativeEnum(FormaEvaluacionAsistencia),
  // OJO: es un umbral mínimo de conexión, no la duración de la clase.
  minutos_minimos: z.number().refine((n) => (MINUTOS_MINIMOS_VALIDOS as readonly number[]).includes(n)),
})

/**
 * La condición configurada. El `null` de "esta sala no lleva lista de asistencia" lo aporta el campo
 * `config.condicion_asistencia` (nullable), no este tipo.
 */
export type CondicionAsistencia = z.infer<typeof condicionAsistenciaSchema>

/**
 * La asistencia de una clase: la ventana temporal (`inicio`/`fin`, epoch ms) y el estado de cada
 * estudiante que pasó por la sala.
 */
export const asistenciaDeClaseSchema = z.object({
  inicio: z.number(),
  fin: z.number(),
  estudiantes: z.array(
    z.object({
      userId: z.string(),
      nombre: z.string(),
      presente: z.boolean(),
    })
  ),
})

export type AsistenciaDeClase = z.infer<typeof asistenciaDeClaseSchema>
