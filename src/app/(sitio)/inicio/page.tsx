import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
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
