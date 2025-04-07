'use client'
import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import { CircleChevronUp } from 'lucide-react'
import Image from 'next/image'
import { Link as Scroll } from 'react-scroll'
import Pantalla from './pantalla'

export default function Contacto() {
  return (
    <div className="contactoini">
      <Pantalla
        title="Contacto"
        one={
          <>
            <p className="text-[#46BFD7] font-bold mb-4">
              ¡Preguntar es clave en todo proceso de enseñanza y aprendizaje!
            </p>
            <p>
              Así que si tenés dudas o querés recibir más información sobre Ludidactas y las propuestas que tenemos para
              vos, no dudes en escribirnos o contactarnos por redes sociales.
            </p>
          </>
        }
        two={<Imagenes />}
        btn={
          <BtnSketchy
            className="block mx-auto h-[56px] leading-[36px]"
            target="_blank"
            href="http://www.instagram.com/ludidactas"
          >
            {' '}
            ¡Contactanos!{' '}
          </BtnSketchy>
        }
        scroll={
          <Scroll to="portadaini" smooth={true} duration={500}>
            <CircleChevronUp className="w-full h-full" />
          </Scroll>
        }
        espejado={true}
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoContacto.png" alt="Personaje4" width={500} height={500} />
  </div>
)
