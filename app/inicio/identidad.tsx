'use client'

import PantallaDesktop from './pantallaDesktop'
import Image from 'next/image'
//@ts-ignore meta
import Ident, { meta } from '@/app/inicio/identidad.mdx'
import Link from 'next/link'
import { Link as Scroll } from 'react-scroll';
import { CircleChevronDown } from 'lucide-react';
import PantallaMobile from './pantallaMobile'

export default function Identidad() {
  return (

    <div className='identidadini'>
      {/* Desktop */}
      <div className='hidden md:block'>

        <PantallaDesktop
          one={<Ident />}
          two={<Imagenes />}
          title={meta.titulo}
          btn={
            <Link className="custom-btn btn-15" href="/identidad">
              {' '}
              Más sobre el proyecto{' '}
            </Link>
          }
          scroll={
            <Scroll to="propuestasini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>
          }
        />
      </div>

      {/* Mobile */}
      <div className='block md:hidden'>

        <PantallaMobile
          title={meta.titulo}
          one={<Ident />}
          two={<Imagenes />}
          btn={
            <Link className="custom-btn btn-15 w-fit" href="/identidad">
              {' '}
              Más sobre el proyecto{' '}
            </Link>
          }
          scroll={
            <Scroll to="propuestasini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>

          } />

      </div>
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoIdentidad.png" alt="Personaje1" width={500} height={500} />
  </div>
)
