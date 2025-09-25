'use client'

import ArrowDownLd from '@/components/custom/ld-arrow-down'
import BtnSketchyGif from '@/components/custom/ld-btn-sketchy-gif'
import Image from 'next/image'
import Pantalla from './pantalla'

export default function Recursos() {
  return (
    <div className="recursosini">
      <Pantalla
        title="Recursos y roadmap"
        one={
          <div className='flex flex-col max-w-[720px] items-center md:mt-20 p-8 gap-4 text-sm md:text-xl'>
            <p>
              Estamos trabajando en hacer disponibles en el sitio los contenidos producidos en los talleres, cursos y
              seminarios de modo que este funcione como biblioteca de recursos y material de referencia, abierto y
              gratuito, para docentes y talleristas.
            </p>
            <p>El primer recurso que hemos desarrollado es una sala de herramientas de para la gestión de interactividad en las clases online.
              Está disponible para que la utilices conectándote con tu cuenta de google. </p>
          </div>
        }
        two={<Imagenes />}
        btn={<BtnSketchyGif className="block text-[1] mx-auto leading-[42px]" href="/encuestas">
          Explorar sala
        </BtnSketchyGif>}
        scroll={<ArrowDownLd to="contactoini" />}
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500} />
  </div>
)
