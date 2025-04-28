'use client'

import Image from 'next/image'
import Pantalla from './pantalla'
import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import ArrowDownLd from '@/components/custom/ld-arrowDown'

export default function Identidad() {
  return (
    <div className="identidadini">
      <Pantalla
        title="¿Quiénes somos?"
        one={
          <>
            <p>
              Ludidactas surge en el año 2020 como un <span className="text-[#46BFD7]">laboratorio didáctico</span> cuyo
              objetivo consiste en la creación de nuevas propuestas pedagógicas de formación docente (herramientas y
              recursos para la enseñanza) y de instancias educativas abiertas a todo público (talleres, cursos,
              encuentros) que atiendan de manera <b>flexible, responsable y eficiente</b> a las preguntas y
              problemáticas subyacentes a la enseñanza.
            </p>
            <p className="mt-4">
              Nuestras propuestas tienen un enfoque{' '}
              <span className="text-[#46BFD7]">interdisciplinar, lúdico y reflexivo</span> y se encuentran articuladas
              en torno técnicas y tecnologías tales como la programación, animación, el desarrollo de videojuegos y las
              matemáticas.
            </p>
          </>
        }
        two={<Imagenes />}
        btn={
          <BtnSketchy className="block mx-auto h-[90px] leading-[62px]" href="/identidad">
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
