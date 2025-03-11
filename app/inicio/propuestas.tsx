'use client'

import PantallaDesktop from './pantallaDesktop'
//@ts-ignore meta
import ContentProp, { meta } from '@/app/inicio/propuestas.mdx'
import { CircleChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Link as Scroll } from 'react-scroll';
import PantallaMobile from './pantallaMobile'


export default function Propuestas() {
  return (
    <div className='propuestasini'>

      {/* Desktop */}
      <div className={'hidden md:block'}>
        <PantallaDesktop
          one={<ContentProp />}
          two={<Imagenes />}
          title={meta.titulo}
          btn={
            <Link className="custom-btn btn-15" href="/propuestas">
              {' '}
              ¡Conoce nuestras propuestas!{' '}
            </Link>
          }
          scroll={
            <Scroll to="recursosini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>

          }
          espejado
        />
      </div>
      
      {/* Mobile */}
      <div className={'block md:hidden'}>

        <PantallaMobile
          title={meta.titulo}
          one={<ContentProp />}
          two={<Imagenes />}
          btn={
            <Link className="custom-btn btn-15 w-fit" href="/identidad">
              {' '}
              ¡Conoce nuestras propuestas!{' '}
            </Link>
          }
          scroll={
            <Scroll to="recursosini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>

          } />

      </div>

    </div>

  )

}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoPropuestas.png" alt="Personaje2" width={500} height={500} />
  </div>
)
