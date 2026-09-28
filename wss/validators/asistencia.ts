import { z } from 'zod'

export enum FormaEvaluacionAsistencia {
  UltimosMinutos = 'ultimos_minutos',
  TotalMinutos = 'total_minutos',
  Conectado = 'conectado',
}

/** Etiquetas de las formas de evaluación, para los selects del FE. */
export const ETIQUETAS_FORMA_DE_EVALUACION: Record<FormaEvaluacionAsistencia, string> = {
  [FormaEvaluacionAsistencia.UltimosMinutos]: 'Conectado los últimos',
  [FormaEvaluacionAsistencia.TotalMinutos]: 'Conectado un total de',
  [FormaEvaluacionAsistencia.Conectado]: 'Se conectó en algún momento',
}

// Techo generoso para una clase real (8 h): sin esto, un valor tipeado a mano sin querer (ej. de más)
// deja la condición imposible de cumplir, marcando ausente a todo el mundo sin ningún aviso.
export const MINUTOS_MAXIMOS = 8 * 60

const minutosMinimos = z.number().int().positive().max(MINUTOS_MAXIMOS)

/**
 * Condición de asistencia de la sala. Vive acá (y no en el FE) porque la validan el server
 * al crear/actualizar la sala y `getSala` al leerla de redis, y la consume el evaluador
 * (`wss/asistencia/evaluacion.ts`): es la fuente única de verdad para los tres lados.
 *
 * Unión discriminada por `forma_evaluacion`: `ultimos_minutos`/`total_minutos` piden un umbral en
 * minutos (`minutos_minimos` — un mínimo de conexión, no la duración de la clase); `conectado` no pide
 * nada, así que no tiene ese campo.
 */
export const condicionAsistenciaSchema = z.discriminatedUnion('forma_evaluacion', [
  // Hay que estar conectado la ventana final de la clase.
  z.object({ forma_evaluacion: z.literal(FormaEvaluacionAsistencia.UltimosMinutos), minutos_minimos: minutosMinimos }),
  // Alcanza con acumular esa cantidad en toda la clase (puede ser en tramos).
  z.object({ forma_evaluacion: z.literal(FormaEvaluacionAsistencia.TotalMinutos), minutos_minimos: minutosMinimos }),
  // Presente con estar conectado en algún momento de la clase, sin importar cuánto.
  z.object({ forma_evaluacion: z.literal(FormaEvaluacionAsistencia.Conectado) }),
])

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

/**
 * Lo que sabemos de la clase abierta de una sala: cuándo la vimos abrir (`inicio`) y cuándo se fue el
 * profe (`fin`). `fin: null` = el profe todavía está adentro. Vive en `wss/salas/db.ts`
 * (`guardarRegistroDeClase`/`getRegistroDeClase`), persistido en redis para sobrevivir a un restart
 * del proceso wss durante la espera post-desconexión.
 */
export const registroDeClaseSchema = z.object({
  inicio: z.number(),
  fin: z.number().nullable(),
})

export type RegistroDeClase = z.infer<typeof registroDeClaseSchema>
