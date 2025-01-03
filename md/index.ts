/**
 * Este módulo lleva a cabo con MD estático lo que luego se resolvería dinámicamente usando
 * los markdowns producidos mediante obsidian o el mdx servido desde el server
 */

// Índice de markdowns
// @ts-expect-error import { meta } no funciona
import Math, { meta as MathMeta } from '@/md/matematica.mdx'
// @ts-expect-error import { meta } no funciona
import Prog, { meta as ProgMeta } from '@/md/programacion.mdx'
// @ts-expect-error import { meta } no funciona
import Game, { meta as GameMeta } from '@/md/gaming.mdx'
// @ts-expect-error import { meta } no funciona
import Ilus, { meta as IlusMeta } from '@/md/ilustracion.mdx'

import { z } from 'zod'
import { MDXProps } from 'mdx/types'
import { Meta, metaSchema } from './schema'

const asegurarFormato = (meta: unknown) => {
  return metaSchema.parse(meta)
}

const articuloVacio = () =>
  structuredClone({
    Contenido: null,
    meta: null,
  })

// Los valores de este enum tienen que matchear los ids que vengan de affinity
export const materiaSchema = z.enum(['matematica', 'programacion', 'gaming', 'ilustracion'])

export type Materia = z.infer<typeof materiaSchema>

// Este mapea ids de affinity a componentes MDX
const materias: Record<Materia, { Contenido: React.ComponentType<MDXProps>; meta: Meta }> = {
  matematica: { Contenido: Math, meta: asegurarFormato(MathMeta) },
  programacion: { Contenido: Prog, meta: asegurarFormato(ProgMeta) },
  gaming: { Contenido: Game, meta: asegurarFormato(GameMeta) },
  ilustracion: { Contenido: Ilus, meta: asegurarFormato(IlusMeta) },
}

/**
 * Evalúa si un string está en nuestro índice (es decir, si es un artículo)
 */
export const esMateria = (id: string): id is Materia => materiaSchema.safeParse(id).success

/**
 * Devuelve un artículo y su `meta`, dado un id, o `[null, null]` si el id no existe
 */
export const getMateria = (id: string) => (esMateria(id) ? materias[id as Materia] : articuloVacio())

export default materias
