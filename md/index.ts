// Índice de markdowns

// app/a/[slug]/page.tsx
import Math, { meta as MathMeta } from '@/md/matematica.mdx'
import Prog, { meta as ProgMeta } from '@/md/programacion.mdx'
import { MDXProps } from 'mdx/types'

// Los valores de este enum tienen que matchear los ids que vengan de affinity
enum Articulo {
  Math = 'matematica',
  Programacion = 'programacion',
}

// Este mapea ids de affinity a componentes MDX
const articulos: Record<Articulo, [React.ComponentType<MDXProps>, Record<string, any>]> = {
  [Articulo.Math]: [Math, MathMeta],
  [Articulo.Programacion]: [Prog, ProgMeta],
}

/**
 * Devuelve un artículo y su `meta`, dado un id, o `[null, null]` si el id no existe
 */
export const getArticulo = (id: string) =>
  Object.keys(articulos).includes(id) ? articulos[id as Articulo] : [null, null]

export default articulos
