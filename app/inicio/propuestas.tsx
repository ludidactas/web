'use client'

import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowDownLd from '@/components/custom/ld-arrowDown'

export default function Propuestas() {
  return (
    <div className="propuestasini">
      <Pantalla
        title="Propuestas"
        one={
          <>
            <p className="pludi">
              En ludidactas hemos diseñado distintas propuestas de aprendizaje:{' '}
              <span className="text-[#46BFD7] font-bold">técnicas, didácticas y pedagógicas. </span>
              Esto quiere decir que{' '}
              <span className="text-[#46BFD7] font-bold">
                tanto si sos profe o estudiante, podés formarte con nosotros!{' '}
              </span>{' '}
            </p>

            <p className="mt-4">
              Te invitamos a que conozcas nuestras líneas de contenido y las distintas modalidades que hemos creado para
              vos.
            </p>
          </>
        }
        two={<Imagenes />}
        btn={
          <BtnSketchy className="block mx-auto h-[64px] leading-[42px]" href="/propuestas">
            {' '}
            Ver propuestas{' '}
          </BtnSketchy>
        }
        scroll={
          <ArrowDownLd to='recursosini'/>
        }
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
