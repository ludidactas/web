import Portada from './portada'
import Identidad from './identidad'
import Propuestas from './propuestas'
import Recursos from './recursos'
import Contacto from './contacto'
import Menu from './menu'

export default function Page() {
  return (
    <div className="mt-[20em]">
     
      <Portada />
      <Identidad />
      <Propuestas />
      <Recursos/>
      <Contacto/>
    </div>
  )
}
