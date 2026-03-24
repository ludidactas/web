'use client'

import ArrowDownLd from '@/components/custom/ld-arrow-down'
import BtnSketchyGif from '@/components/custom/ld-btn-sketchy-gif'
import { LdSvg } from '@/components/custom/ld-svg'
import QuienesSomos from '@/svg/titles/QuienesSomosSVGO.svg'
import Image from 'next/image'
import { Hl } from './highlight'
import Pantalla from './pantalla'

export default function Identidad() {
  return (
    <>
      <div className="identidadini bg-indigo-300/50">
        <Pantalla
          title={<LdSvg className="h-8 lg:h-20" SvgComponent={QuienesSomos} />}
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
          two={<Imagenes />}
          btn={
            <BtnSketchyGif className="block text-[1.5em] md:text-[1em] mx-auto h-fit leading-[50px]" href="/identidad">
              {' '}
              Más sobre el proyecto{' '}
            </BtnSketchyGif>
          }
          scroll={<ArrowDownLd to="propuestasini" />}
        />
      </div>
    </>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoIdentidad.png" alt="Personaje1" width={500} height={500} />
  </div>
)
