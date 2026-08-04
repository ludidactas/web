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
          <div className="flex flex-col max-w-[720px] items-center gap-4 text-sm md:text-xl">
            <p>
              El primer recurso que hemos desarrollado es una{' '}
              <Hl>sala de herramientas de para la gestión de interactividad en las clases online</Hl>. Está disponible
              para que la utilices conectándote con tu cuenta de google.{' '}
            </p>
            <p>
              Estamos trabajando en otras herramientas didácticas y en hacer disponibles en el sitio los contenidos
              producidos en los talleres, cursos y seminarios de modo que este funcione como biblioteca de recursos y
              material de referencia, abierto y gratuito, para docentes y talleristas.
            </p>
          </div>
        }
        two={<Imagenes />}
        btn={<BotonLink titulo={'Explorar Sala'} url={'/salas'} />}
        scroll={<ArrowDownLd to="contactoini" />}
        espejado
      />
    </div>
  )
}

const Imagenes = () => (
  <div className="mt-10 md:mt-0">
    <Image src="/img/PersoRecursos.webp" alt="Personaje3" width={500} height={500} />
  </div>
)
