'use client'
import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowUpLd from '@/components/custom/ld-arrow-up'
import { BotonLink } from '@/components/custom/ld-boton-svg'
import { Title } from '@/components/custom/ld-title'

export default function Contacto() {
  return (
    <div className="contactoini">
      <Pantalla
        classname="mb-0"
        title={<Title radius={2} text={'Contacto'} color={'text-[#00B0D2]'} size={'text-4xl md:text-7xl'}/>
       }
        one={
          <div className="flex flex-col max-w-[720px] text-center items-center md:p-8 text-[1.5em] md:text-3xl gap-4">
            <p className="text-[#46BFD7] font-bold md:mb-4">
              ¡Preguntar es clave en todo proceso de enseñanza y aprendizaje!
            </p>
            <p>
              Si tenés consultas, preguntas o propuestas, no dudes en escribirnos o contactarnos por redes sociales.
            </p>
          </div>
        }
        two={<Imagenes />}
        btn={
          <BotonLink titulo={'¡Contactanos!'} url={"http://www.instagram.com/ludidactas"} />
         
        }
        scroll={<ArrowUpLd to="portadaini" />}
        espejado={true}
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoContacto.webp" alt="Personaje4" width={500} height={500} />
  </div>
)
