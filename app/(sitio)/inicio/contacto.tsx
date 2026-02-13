'use client'
import BtnSketchyGif from '@/components/custom/ld-btn-sketchy-gif'
import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowUpLd from '@/components/custom/ld-arrow-up'
import { LdSvg } from '@/components/custom/ld-svg'
import contacto from '@/svg/titles/ContactoSVGO.svg'

export default function Contacto() {
  return (
    <div className="contactoini">
      <Pantalla classname='mb-0'
        title={<LdSvg className='h-8 lg:h-20' SvgComponent={contacto}/>}
        one={
          <div className='flex flex-col max-w-[720px] text-center items-center p-8 text-[1.5em] md:text-3xl gap-4'>
            <p className="text-[#46BFD7] font-bold mb-4">
              ¡Preguntar es clave en todo proceso de enseñanza y aprendizaje!
            </p>
            <p>
              Si tenés consultas, preguntas o propuestas, no dudes en escribirnos o contactarnos por redes sociales.
            </p>
          </div>
        }
        two={<Imagenes />}
        btn={
          <BtnSketchyGif
            className="block mx-auto h-[56px] leading-[36px]"
            target="_blank"
            href="http://www.instagram.com/ludidactas"
          >
            {' '}
            ¡Contactanos!{' '}
          </BtnSketchyGif>
        }
        scroll={
         <ArrowUpLd to='portadaini'/>
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
