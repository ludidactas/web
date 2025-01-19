/**
 * Este módulo lleva a cabo con MD estático lo que luego se resolvería dinámicamente usando
 * los markdowns producidos mediante obsidian o el mdx servido desde el server
 */

// Índice de markdowns

// // @ts-expect-error import { meta } no funciona
// import Math, { meta as MathMeta } from '@/md/matematica.mdx'
// // @ts-expect-error import { meta } no funciona
// import Prog, { meta as ProgMeta } from '@/md/programacion/programacion.mdx'
// // @ts-expect-error import { meta } no funciona
// import Game, { meta as GameMeta } from '@/md/gaming.mdx'
// // @ts-expect-error import { meta } no funciona
// import Ilus, { meta as IlusMeta } from '@/md/ilustracion.mdx'

// const materias: Record<Materia, { Contenido: React.ComponentType<MDXProps>; meta: Meta }> = {
//   matematica: { Contenido: Math, meta: asegurarFormato(MathMeta) },
//   programacion: { Contenido: Prog, meta: asegurarFormato(ProgMeta) },
//   gaming: { Contenido: Game, meta: asegurarFormato(GameMeta) },
//   ilustracion: { Contenido: Ilus, meta: asegurarFormato(IlusMeta) },
// }

import { importMDXFiles } from '@/lib/mdxLoader'
import { Materia, materiaMetaSchema, materiaSchema, MetaMateria, MetaUnidad, unidadMetaSchema } from './schema'

/**
 * Verifica que el meta matchee el formato de materia o de unidad
 */
const verificarFormato = (meta: unknown) => {
  if (!materiaMetaSchema.safeParse(meta).success || !unidadMetaSchema.safeParse(meta).success)
    throw new Error(`Error parseando archivo`)
}

const articuloVacio = () =>
  structuredClone({
    Contenido: null,
    meta: null,
  })

// Este mapea ids de affinity a componentes MDX
const articulos = await importMDXFiles()

Object.values(articulos)
  .map(({ meta }) => meta)
  .forEach(verificarFormato)

type ArticulosMaterias = { [k: string]: { default: React.ComponentType; meta: MetaMateria } }
export const materias = Object.fromEntries(
  Object.entries(articulos).filter(([, modulo]) => modulo.meta.tipo == 'materia')
) as ArticulosMaterias

type ArticulosUnidades = { [k: string]: { default: React.ComponentType; meta: MetaUnidad } }
export const unidades = Object.fromEntries(
  Object.entries(articulos).filter(([, modulo]) => modulo.meta.tipo == 'unidad')
) as ArticulosUnidades

// const articulos = { test: (await import('@/md/gaming.mdx')) as MDXModule }
// const articulos = { test: true }

// Verificamos que todos matcheen el formato requerido en el meta
// values(articulos)
//   .map(({ meta }) => meta)
//   .forEach(verificarFormato)

console.log(`MDs cargados!`)
// console.log(articulos)

/**
 * Evalúa si un string está en nuestro índice (es decir, si es un artículo)
 */
export const esMateria = (id: string): id is Materia => materiaSchema.safeParse(id).success

/**
 * Devuelve un artículo y su `meta`, dado un id, o `[null, null]` si el id no existe
 */
export const getMateria = (id: string) => (esMateria(id) ? articulos.test : articuloVacio())

export const getArticulo = getMateria

// export default [] as any
export default articulos
