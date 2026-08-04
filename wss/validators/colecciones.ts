import z from 'zod'

import { crearEncuesta } from './polls'

/** Versión del formato de archivo de colección. Subirla si cambia la forma del YAML. */
export const VERSION_COLECCION = 1

/**
 * "Sobre" de una colección de preguntas serializada (YAML).
 *
 * Las `preguntas` se dejan como `unknown[]` a propósito: al importar validamos
 * cada una por separado con {@link crearEncuesta}, así una pregunta inválida no
 * tira abajo toda la importación.
 */
export const sobreColeccion = z.object({
  version: z.number().optional(),
  nombre: z.string().trim().min(1).optional(),
  preguntas: z.array(z.unknown()),
})

export type SobreColeccion = z.infer<typeof sobreColeccion>

/**
 * Una pregunta tal como se exporta/importa (la forma de {@link crearEncuesta}).
 * Usamos el tipo de entrada (no el de salida) para que los campos con default
 * (como `isOpen`/`isPublished`) sean opcionales: el YAML no los necesita.
 */
export type PreguntaColeccion = z.input<typeof crearEncuesta>
