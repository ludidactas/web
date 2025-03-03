'use client'

import Pantalla from './pantalla'
import Image from 'next/image'
//@ts-ignore meta
import Recur, { meta } from '@/app/inicio/recursos.mdx'
import Link from 'next/link'
import {Link as Scroll} from 'react-scroll';
import { CircleChevronDown } from 'lucide-react';


export default function Recursos() {
  return(
  
  <div className='recursosini'>
    <Pantalla
      one={<Recur />}
      two={<Imagenes />}
      title={meta.titulo}
      btn={
        <Link className="custom-btn btn-15" href="/roadmap">
          {' '}
          Proximamente...{' '}
        </Link>
      }
      scroll={<Scroll to="contactoini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>
    }
    />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500} />
  </div>
)
