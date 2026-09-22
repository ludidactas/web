'use client'

import ArrowDownLd from '@/components/custom/ld-arrow-down'
import Image from 'next/image'
import Pantalla from './pantalla'
import { Hl } from './highlight'
import { BotonLink } from '@/components/custom/ld-boton-svg'
import { Title } from '@/components/custom/ld-title'

export default function Recursos() {
  return (
    <div className="recursosini ">
      <Pantalla
        title={<Title radius={2} text={'Salas y Recursos'} color={'text-ld-violeta'} size={'text-4xl md:text-7xl'} />}
        one={
          <div className="flex flex-col max-w-[720px] items-center md:items-start gap-4 text-sm md:text-xl">
            <p>
              El primer recurso que hemos desarrollado es una{' '}
              <Hl>sala de herramientas de para la gestión de interactividad en las clases online</Hl>. Está disponible
              para que la uses conectándote con tu cuenta de google. <Hl>Compartís el link</Hl> y tus participantes se
              conectan sin registrarse.
            </p>
            <p>
              En una <Hl>sala</Hl> podés compartir <Hl>encuestas en vivo</Hl> y <Hl>partidas del juego de Go</Hl>. Están
              pensadas para escenarios educativos y son gratuitas.
            </p>
            <p>¡Te invitamos a probarlas!</p>
          </div>
        }
        two={<Imagenes />}
        btn={<BotonLink titulo={'Explorar Sala'} url={'/salas'} />}
        scroll={<ArrowDownLd to="propuestasini" />}
        espejado
      />
    </div>
  )
}

const Imagenes = () => (
  <div className="mt-10 md:mt-0">
    <Image src="/img/PersoRecursos.webp" alt="Personaje3" width={1035} height={829} />
  </div>
)
