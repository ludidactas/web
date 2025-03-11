import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
import WithAOS from '@/components/ui/with-aos'
import Hero from './hero'


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
