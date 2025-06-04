'use client'
import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import Image from 'next/image'
import Pantalla from './pantalla'
import ArrowUpLd from '@/components/custom/ld-arrowUp'

export default function Contacto() {
  return (
    <div className="contactoini">
      <Pantalla
        title="Contacto"
        one={
          <div className='flex flex-col items-center mt-40 p-8 text-3xl gap-4'>
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
          <BtnSketchy
            className="block hover:underline mx-auto text-2xl h-[110px] leading-[70px]"
            target="_blank"
            href="http://www.instagram.com/ludidactas"
          >
            {' '}
            ¡Contactanos!{' '}
          </BtnSketchy>
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
