'use client'
import BtnSketchyGif from '@/components/custom/ld-btn-sketchy-gif'
import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowUpLd from '@/components/custom/ld-arrow-up'

export default function Contacto() {
  return (
    <div className="contactoini">
      <Pantalla
        title="Contacto"
        one={
          <div className='flex flex-col gap-4 max-w-[480px]'>
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
