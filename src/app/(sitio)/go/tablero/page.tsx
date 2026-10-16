import { Metadata } from 'next'
import ContenidoGoLocal from './contenido'

export const metadata: Metadata = {
  title: 'Tablero de Go',
}

export default function Page() {
  return <ContenidoGoLocal />
}
