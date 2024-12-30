//@ts-nocheck - el export meta es problemático
// Índice de markdowns

// app/a/[slug]/page.tsx
import Math, { meta as MathMeta } from '@/md/matematica.mdx'
import Prog, { meta as ProgMeta } from '@/md/programacion.mdx'
import Game, { meta as GameMeta } from '@/md/gaming.mdx'
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
export enum Articulo {
  Math = 'matematica',
  Programacion = 'programacion',
  Gaming = 'gaming',
}

// Este mapea ids de affinity a componentes MDX
const articulos: Record<Articulo, { Contenido: React.ComponentType<MDXProps>; meta: Meta }> = {
  [Articulo.Math]: { Contenido: Math, meta: asegurarFormato(MathMeta) },
  [Articulo.Programacion]: { Contenido: Prog, meta: asegurarFormato(ProgMeta) },
  [Articulo.Gaming]: { Contenido: Game, meta: asegurarFormato(GameMeta) },
}

/**
 * Evalúa si un string está en nuestro índice (es decir, si es un artículo)
 */
export const esArticulo = (id: string): id is Articulo => Object.keys(articulos).includes(id)

/**
 * Devuelve un artículo y su `meta`, dado un id, o `[null, null]` si el id no existe
 */
export const getArticulo = (id: string) => (esArticulo(id) ? articulos[id as Articulo] : articuloVacio())

export default articulos
