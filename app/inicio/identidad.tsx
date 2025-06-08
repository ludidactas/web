'use client'

import Image from 'next/image'
import Pantalla from './pantalla'
import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import { Hl } from './highlight'
import ArrowDownLd from '@/components/custom/ld-arrowDown'

export default function Identidad() {
  return (
    <div className="identidadini">
      <Pantalla
        title="¿Quiénes somos?"
        one={
          <div className="flex flex-col max-w-[480px] items-center mt-8 p-8 gap-2 text-2xl">
            <p>
              Ludidactas surge en el año 2020 como un <Hl>laboratorio didáctico</Hl> con el objetivo de gestar
              propuestas y recursos didácticos y pedagógicos (herramientas y recursos para la enseñanza) y de instancias
              educativas abiertas a todo público (talleres, cursos, encuentros) que atiendan de manera{' '}
              <Hl>flexible, responsable y eficiente</Hl> a las preguntas y problemáticas subyacentes a la educación de
              nuestro momento.
            </p>
            <p>
              El laboratorio está creciendo en torno a la visión de una comunidad en la que <Hl>formación educativa</Hl>{' '}
              (practicar <em>para</em> profe) y la <Hl>formación técnica</Hl> (practicar <em>con</em> un profe) se dan
              lado a lado.
            </p>
          </div>
        }
        two={<Imagenes />}
        btn={
          <BtnSketchy className="block hover:underline mx-auto text-2xl h-[110px] leading-[70px]" href="/identidad">
            {' '}
            Más sobre el proyecto{' '}
          </BtnSketchy>
        }
        scroll={
         <ArrowDownLd to='propuestasini'/>
        }
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoIdentidad.png" alt="Personaje1" width={500} height={500} />
  </div>
)
