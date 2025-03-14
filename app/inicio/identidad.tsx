'use client'

import Image from 'next/image'
//@ts-ignore meta
import { CircleChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Link as Scroll } from 'react-scroll'
import Pantalla from './pantalla'

export default function Identidad() {
  return (

    <div className='identidadini'>

        <Pantalla
          title= "¿Quiénes somos?"
          one={<p className='pludi'>Ludidactas surge en el año 2020 como un <span className="text-[#46BFD7]">laboratorio didáctico</span> cuyo objetivo consiste en la creación de nuevas propuestas pedagógicas de formación docente (herramientas y recursos para la enseñanza) y de instancias educativas abiertas a todo público (talleres, cursos, encuentros) que atiendan de manera flexible, responsable y eficiente a las preguntas y problemáticas subyacentes a la enseñanza.
                Nuestras propuestas tienen un enfoque <span className="text-[#46BFD7]">interdisciplinar, lúdico y reflexivo</span> y se encuentran articuladas en torno técnicas y tecnologías tales como la programación, animación, el desarrollo de videojuegos y las matemáticas.</p>}
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
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoIdentidad.png" alt="Personaje1" width={500} height={500} />
  </div>
)
