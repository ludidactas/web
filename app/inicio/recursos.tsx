'use client'

import Image from 'next/image'
import { CircleChevronDown } from 'lucide-react'
import { Link as Scroll } from 'react-scroll'
import Pantalla from './pantalla'

export default function Recursos() {
  return (
    <div className="recursosini">
      <Pantalla
        title="Recursos y roadmap"
        one={
          <>
            <p>
              Los contenidos producidos en los talleres, cursos y seminarios los hemos hecho disponibles en el sitio
              web, de modo que este funcione como biblioteca de recursos. Estos recursos funcionan como material de
              referencia, abierto y gratuito.
            </p>

            <p className="font-bold mt-4 text-[#46BFD7]">¡Explorá los recursos!</p>
          </>
        }
        two={<Imagenes />}
        btn={
          <button className="custom-btn btndisabled w-fit p-2 " disabled>
            {' '}
            Próximamente...{' '}
          </button>
        }
        scroll={
          <Scroll to="contactoini" smooth={true} duration={500}>
            <CircleChevronDown className="w-full h-full" />
          </Scroll>
        }
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500} />
  </div>
)
