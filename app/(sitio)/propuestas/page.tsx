
import { Metadata } from 'next'
import ContenidoPropuestas from './contenido'


export const metadata: Metadata = {
  title: 'Propuestas',
}

export default function Page() {
  return (
    <>
      <ContenidoPropuestas />
    </>
  )
}
