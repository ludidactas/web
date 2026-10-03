import { Metadata } from 'next'
import ContenidoDojoGo from './contenido'
import { capituloOgsOInicial, getDesafiosOgs } from '@/lib/go-dojo/desafios'

export const metadata: Metadata = {
  title: 'Dojo de Go',
}

/** Página pública del dojo — server component: carga el capítulo de OGS pedido en `?capitulo=` (por default
 * Fundamentos, ver `@/lib/go-dojo/desafios`) y se lo pasa a `ContenidoDojoGo` (client component, en `./contenido.tsx`). */
export default async function Page({ searchParams }: { searchParams: Promise<{ capitulo?: string }> }) {
  const capitulo = capituloOgsOInicial((await searchParams).capitulo)
  const challenges = await getDesafiosOgs(capitulo)
  return <ContenidoDojoGo challenges={challenges} capitulo={capitulo} />
}
