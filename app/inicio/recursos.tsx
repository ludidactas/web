'use client'

import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowDownLd from '@/components/custom/ld-arrowDown'

export default function Recursos() {
  return (
    <div className="recursosini">
      <Pantalla
        title="Recursos y roadmap"
        one={
          <div className="flex flex-col gap-4 max-w-[480px]">
            <p>
              Los contenidos producidos en los talleres, cursos y seminarios los hemos hecho disponibles en el sitio
              web, de modo que este funcione como biblioteca de recursos. Estos recursos funcionan como material de
              referencia, abierto y gratuito.
            </p>

            <p className="font-bold mt-4 text-[#46BFD7]">¡Explorá los recursos!</p>
          </div>
        }
        two={<Imagenes />}
        btn={<p className="text-neutral-500">Próximamente...</p>}
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
