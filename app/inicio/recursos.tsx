'use client'

import PantallaDesktop from './pantallaDesktop'
import Image from 'next/image'
//@ts-ignore meta
import Recur, { meta } from '@/app/inicio/recursos.mdx'
import {Link as Scroll} from 'react-scroll';
import { CircleChevronDown } from 'lucide-react';
import PantallaMobile from './pantallaMobile';


export default function Recursos() {
  return(
  
  <div className='recursosini'>

      {/* Desktop */}
      <div className={'hidden md:block'}>

    <PantallaDesktop
      one={<Recur />}
      two={<Imagenes />}
      title={meta.titulo}
      btn={
        <button className="custom-btn btn-15 btndisabled" disabled>
          {' '}
          Próximamente...{' '}
        </button>
      }
      scroll={<Scroll to="contactoini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>
    }
    />
    </div>
{/* Mobile */}
<div className={'block md:hidden'}>

<PantallaMobile
  title={meta.titulo}
  one={<Recur />}
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

    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500} />
  </div>
)
