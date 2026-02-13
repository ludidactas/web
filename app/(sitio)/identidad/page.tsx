import { Metadata } from 'next'
import ContenidoIdentidad from './contenido'


export const metadata: Metadata = {
  title: 'Identidad',
}

export default function Page() {
  return(
    <ContenidoIdentidad/>
  )

}