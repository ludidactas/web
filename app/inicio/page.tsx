import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
import WithAOS from '@/components/ui/with-aos'
import Hero from './hero'
import { Metadata } from 'next'

// Forzamos a que sea estática 
// (por alguna razón Vercel buildea como si fuera ISR)
export const dynamic = 'error'

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Laboratorio didáctico-pedagógico.',
  openGraph: {
    title: 'Ludidactas - Edudación emergente',
    description: 'Laboratorio didáctico-pedagógico',
    images: ['https://ludidactas.com/img/Compo.png'],
  },
}

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center">
      <WithAOS>
        <Hero />
        <Portada />
        <Identidad />
        <Propuestas />
        <Recursos />
        <Contacto />
      </WithAOS>
    </div>
  )
}
