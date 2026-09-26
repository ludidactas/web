import { Metadata } from 'next'
import ContenidoDojoGo from './contenido'
import { getDesafiosEjemplo } from '@/lib/go-dojo/desafios'

export const metadata: Metadata = {
  title: 'Dojo de Go',
}

/** Página pública del dojo — server component: carga la colección "ejemplo" (`@/lib/go-dojo/desafios`)
 * y se la pasa a `ContenidoDojoGo` (client component, en `./contenido.tsx`). */
export default function Page() {
  const challenges = getDesafiosEjemplo()
  return <ContenidoDojoGo challenges={challenges} />
}
