'use client'

import ArrowDownLd from '@/components/custom/ld-arrow-down'
import { BotonLink } from '@/components/custom/ld-boton-svg'
import { Title } from '@/components/custom/ld-title'
import Image from 'next/image'
import Pantalla from './pantalla'

export default function Propuestas() {
  return (
    <div className="propuestasini bg-indigo-300/50">
      <Pantalla
        title={<Title radius={2} text={'Propuestas'} color={'text-ld-azul'} size={'text-4xl md:text-7xl'}/>}
        one={
          <div className="flex flex-col md:max-w-[45vw] items-center gap-2 text-sm md:text-[1em]">
            <p>
              El proyecto nace, vive y se sostiene en su comunidad y se ordena en torno la visión de construir la
              educación que queremos ver en el mundo.
            </p>
            <p>
              Si buscás acercarte al rol de profe o si ya lo estás practicando, encontrarás pares que están aprendiendo
              lo mismo y disfrutan de practicarlo y construirlo en grupo, y un espacio para tu voz. Y algunos otros
              recursos...
            </p>
            <p>
              Si buscás practicar y aprender artes y disciplinas (programación, música, ilustración, ciencias, etc...)
              encontrarás una comunidad de profes excepcionales, profes que practican.
            </p>
            <p>
              Diseñamos nuestras propuestas en torno a alimentar y entreconectar esas dos comunidades, convencidxs de
              que los dos roles en que están compartimentadas en relaidad no existen, y allí hay en verdad un solo
              continuo gradiente.
            </p>

            <p>
              De momento nos estamos volcando enteramente al desarrollo de herramientas. Pronto volveremos a abrir las
              propuestas formativas tanto para estudiantes como formadores.
            </p>

            {/* <p>
              Organizamos el contenido y propuestas en tres líneas: <Hl>técnica, didáctica y pedagógica. </Hl>
            </p> */}
          </div>
        }
        two={<Imagenes />}
        btn={<BotonLink titulo={'Proximamente...'} url={''} />}
        scroll={<ArrowDownLd to="recursosini" />}
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoPropuestas.webp" alt="Personaje2" width={500} height={500} />
  </div>
)
