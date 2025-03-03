'use client'
import { CircleChevronDown, CircleChevronUp } from 'lucide-react'
import Pantalla from './pantalla'
// @ts-ignore meta
import ContentCont, { meta } from '@/app/inicio/contacto.mdx'
import Image from 'next/image'
import Link from 'next/link'
import {Link as Scroll} from 'react-scroll';


export default function Contacto() {
  return (<div className='contactoini'>

    <Pantalla
      one={<ContentCont />}
      two={<Imagenes />}
      title={meta.titulo}
      btn={
        <Link className="custom-btn btn-15" href="/contacto">
          {' '}
          ¡Contáctanos!{' '}
        </Link>
      }
      scroll={
        <Scroll to="heroini" smooth={true} duration={500}><CircleChevronUp className="w-full h-full" /></Scroll>
        
      }
      espejado
      />
      </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoContacto.png" alt="Personaje4" width={500} height={500} />
  </div>
)
