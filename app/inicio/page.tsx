import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
import WithAOS from '@/components/ui/with-aos'
import Hero from './hero'


export default function Page() {
  return (<div className='flex flex-col items-center justify-center'>

  <WithAOS>
      <Hero className="heroini self-center w-[1300px] border-solid border-4 border-black rounded-xl flex gap-2 p-5 items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50"/>
      <Portada />
      <Identidad />
      <Propuestas />
      <Recursos />
      <Contacto />
    </WithAOS>
 
  </div>
  )
}
