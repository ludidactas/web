'use client'

import ArrowDownLd from '@/components/custom/ld-arrow-down'
import Image from 'next/image'
import { Hl } from './highlight'
import Pantalla from './pantalla'
import { BotonLink } from '@/components/custom/ld-boton-svg'
import { Title } from '@/components/custom/ld-title'

export default function Identidad() {
  return (
      <div className="identidadini bg-indigo-300/50">
        <Pantalla
          title={
            <Title radius={2} text={'¿Quiénes Somos?'} color={'text-[#8345FD]'} size={'text-4xl md:text-7xl'}/>
           }
          one={
            <div className="flex flex-col gap-2 md:gap-8 md:max-w-[35vw] text-[1.5em] md:text-[1.1em]">
              <p>
                Ludidactas surge en el año 2020 como un <Hl>laboratorio didáctico</Hl> con el objetivo de gestar
                propuestas y recursos didácticos y pedagógicos (herramientas y recursos para la enseñanza) y de
                instancias educativas abiertas a todo público (talleres, cursos, encuentros) que atiendan de manera{' '}
                <Hl>flexible, responsable y eficiente</Hl> a las preguntas y problemáticas subyacentes a la educación de
                nuestro momento.
              </p>
              <p>
                El laboratorio está creciendo en torno a la visión de una comunidad en la que{' '}
                <Hl>formación educativa</Hl> (practicar <em>para</em> profe) y la <Hl>formación técnica</Hl> (practicar{' '}
                <em>con</em> un profe) se dan lado a lado.
              </p>
            </div>
          }
          two={<Imagenes/>}
          btn={
            <BotonLink
              titulo={'Más sobre el proyecto'}
              url={'/identidad'} />
          }
          scroll={<ArrowDownLd to="propuestasini" />}
        />
      </div>
    
  )
}

  const Imagenes = () => (
  <div className='mt-10 md:mt-0'>
    <Image src="/img/PersoIdentidad.webp" alt="Personaje1" width={500} height={500} />
  </div>
)
