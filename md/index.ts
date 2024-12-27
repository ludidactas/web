//@ts-nocheck - Para que no joda con el import de mdx/types. Quitar esta línea si hay que debuguear.

// Índice de markdowns

// app/a/[slug]/page.tsx
import Math, { meta as MathMeta } from '@/md/matematica.mdx'
import Prog, { meta as ProgMeta } from '@/md/programacion.mdx'
import Game, { meta as GameMeta } from '@/md/gaming.mdx'
import { MDXProps } from 'mdx/types'

// Los valores de este enum tienen que matchear los ids que vengan de affinity
export enum Articulo {
  Math = 'matematica',
  Programacion = 'programacion',
  Gaming = 'gaming',
}

// Este mapea ids de affinity a componentes MDX
const articulos: Record<Articulo, [React.ComponentType<MDXProps>, Record<string, any>]> = {
  [Articulo.Math]: [Math, MathMeta],
  [Articulo.Programacion]: [Prog, ProgMeta],
  [Articulo.Gaming]: [Game, GameMeta],
}

/**
 * Devuelve un artículo y su `meta`, dado un id, o `[null, null]` si el id no existe
 */
export const getArticulo = (id: string) =>
  Object.keys(articulos).includes(id) ? articulos[id as Articulo] : [null, null]

export default articulos
