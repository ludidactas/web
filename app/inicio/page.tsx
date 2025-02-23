import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
import WithAOS from '@/components/ui/with-aos'
import Footer from './footer'

export default function Page() {
  return (
    <WithAOS >
      <Portada />
      <Identidad />
      <Propuestas />
      <Recursos/>
      <Contacto/>
      <Footer/>
    </WithAOS>
  )
}
