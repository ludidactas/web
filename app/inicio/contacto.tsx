'use client'
import { CircleChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Link as Scroll } from 'react-scroll'
import Pantalla from './pantalla'


export default function Contacto() {
  return (
  
  <div className='contactoini'>
    
    <Pantalla
        title= "Contacto"
        one={<p className='pludi'>¡Preguntar es clave en todo proceso de enseñanza y aprendizaje! Así que si tienes dudas o deseas
           recibir más información sobre Ludidactas y las propuestas que tenemos para tí, no dudes en escribirnos o contactarnos 
           por redes sociales.
        </p>}
        two={<Imagenes />}
        btn={
          <Link className="custom-btn btn-15 w-fit" target="_blank" href="http://www.instagram.com/ludidactas">
            {' '}
            ¡Contáctanos!{' '}
          </Link>
        }
        scroll={
          <Scroll to="portadaini" smooth={true} duration={500}><CircleChevronUp className="w-full h-full" /></Scroll>

        } />
      </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoContacto.png" alt="Personaje4" width={500} height={500} />
  </div>
)
