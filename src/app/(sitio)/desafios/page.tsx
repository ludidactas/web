import { Metadata } from 'next'
import ContenidoDesafios from './contenido'
import { getDesafios } from './datos'

export const metadata: Metadata = {
  title: 'Desafios',
}

export default function Page() {
  const desafios = getDesafios()
  return <ContenidoDesafios desafios={desafios} />
}
