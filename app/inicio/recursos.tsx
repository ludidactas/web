'use client'

import Image from 'next/image';
import { CircleChevronDown } from 'lucide-react';
import { Link as Scroll } from 'react-scroll';
import Pantalla from './pantalla';


export default function Recursos() {
  return (

    <div className='recursosini'>

      <Pantalla
        title="Recursos y roadmap"
        one={<p className='pludi'>
          Los contenidos producidos en los talleres, cursos y seminarios los hemos hechos disponibles en el sitio web, de modo que este funcione como biblioteca de recursos.

          Estos recursos funcionan como material de referencia, abierto y gratuito.

          <span className="text-center font-bold px-10 text-[#46BFD7]">¡Explorá los recursos que hemos creado para ti!</span>
        </p>}
        two={<Imagenes />}
        btn={
          <button className="custom-btn btn-15 btndisabled w-fit" disabled>
            {' '}
            Próximamente...{' '}
          </button>
        }
        scroll={
          <Scroll to="contactoini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>

        } />

    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500} />
  </div>
)
