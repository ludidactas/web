'use client'

import BtnSketchyGif from '@/components/custom/ld-btn-sketchy-gif'
import Image from 'next/image'
import Pantalla from './pantalla'
import { Hl } from './highlight'
import ArrowDownLd from '@/components/custom/ld-arrow-down'

export default function Propuestas() {
  return (
    <div className="propuestasini">
      <Pantalla
        title="Propuestas"
        one={
          <div className="flex flex-col gap-4 max-w-[480px]">
            <p>
              El proyecto nace, vive y se sostiene en su comunidad y se ordena en torno la visión de construir la
              educación que queremos ver.
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

            <p className="mt-4">
              Organizamos el contenido y propuestas en tres líneas: <Hl>técnica, didáctica y pedagógica. </Hl>
            </p>
          </div>
        }
        two={<Imagenes />}
        btn={
          <BtnSketchyGif className="block mx-auto h-[64px] leading-[42px]" href="/propuestas">
            {' '}
            Ver propuestas{' '}
          </BtnSketchyGif>
        }
        scroll={<ArrowDownLd to="recursosini" />}
        espejado={true}
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoPropuestas.png" alt="Personaje2" width={500} height={500} />
  </div>
)
