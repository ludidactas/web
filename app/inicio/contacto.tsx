'use client'
import { CircleChevronUp } from 'lucide-react'
// @ts-ignore meta
import ContentCont, { meta } from '@/app/inicio/contacto.mdx'
import Image from 'next/image'
import Link from 'next/link'
import {Link as Scroll} from 'react-scroll';
import PantallaDesktop from './pantallaDesktop'
import PantallaMobile from './pantallaMobile'


export default function Contacto() {
  return (
  
  <div className='contactoini'>

     {/* Desktop */}
     <div className='hidden md:block'>
    <PantallaDesktop
      one={<ContentCont />}
      two={<Imagenes />}
      title={meta.titulo}
      btn={
        <Link className="custom-btn btn-15" href="https://www.instagram.com/ludidactas" target='_blank'>
          {' '}
          ¡Contáctanos!{' '}
        </Link>
      }
      scroll={
        <Scroll to="logolema" smooth={true} duration={500}><CircleChevronUp className="w-full h-full" /></Scroll>
        
      }
      espejado
      />
      </div>

      {/* Mobile */}
      <div className='block md:hidden'>

        <PantallaMobile
          title={meta.titulo}
          one={<ContentCont />}
          two={<Imagenes />}
          btn={
            <Link className="custom-btn btn-15 w-fit" href="/identidad">
              {' '}
              ¡Contáctanos!{' '}
            </Link>
          }
          scroll={
            <Scroll to="heroini" smooth={true} duration={500}><CircleChevronUp className="w-full h-full" /></Scroll>

          } />

      </div>
      </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoContacto.png" alt="Personaje4" width={500} height={500} />
  </div>
)
