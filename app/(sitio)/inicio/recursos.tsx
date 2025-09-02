'use client'

import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowDownLd from '@/components/custom/ld-arrow-down'

export default function Recursos() {
  return (
    <div className="recursosini">
      <Pantalla
        title="Recursos y roadmap"
        one={
          <div className='flex flex-col max-w-[720px] items-center md:mt-20 p-8 gap-4 text-sm md:text-xl'>
            <p>
              Estamos trabajando en hacer disponibles en el sitio los contenidos producidos en los talleres, cursos y
              seminarios de modo que este funcione como biblioteca de recursos como material de referencia, abierto y
              gratuito, para docentes y talleristas.
            </p>
          </div>
        }
        two={<Imagenes />}
        btn={<p className="text-neutral-500 self-center">¡Proximamente!</p>}
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
