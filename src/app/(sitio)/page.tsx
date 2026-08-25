import Portada from './inicio/portada'
import Identidad from './inicio/identidad'
import Propuestas from './inicio/propuestas'
import Recursos from './inicio/recursos'
import Contacto from './inicio/contacto'
import WithAOS from '@/components/ui/with-aos'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Laboratorio didáctico-pedagógico.',
  openGraph: {
    title: 'Ludidactas - Educación emergente',
    description: 'Laboratorio didáctico-pedagógico',
    images: ['https://ludidactas.com/img/Compo.webp'],
  },
}

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <WithAOS>
        {/* <Hero /> */}
        <Portada />
        <Identidad />
        <Recursos />
        <Propuestas />
        <Contacto />
      </WithAOS>
    </div>
  )
}
