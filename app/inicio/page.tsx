import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
import WithAOS from '@/components/ui/with-aos'
import Hero from './hero'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ludidactas',
  openGraph: {
    title: 'Ludidactas - Edudación emergente',
    description: 'Motor didáctico-pedagógico',
    images: ''
  }
}

export default function Page() {
  return (
  
  <div className='flex flex-col items-center justify-center'>
   <WithAOS>
      <Hero/>
      <Portada />
      <Identidad />
      <Propuestas />
      <Recursos />
      <Contacto />
    </WithAOS>
 
  </div>
  )
}
