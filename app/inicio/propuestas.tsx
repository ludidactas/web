'use client'

import { CircleChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Link as Scroll } from 'react-scroll';
import Pantalla from './pantalla';


export default function Propuestas() {
  return (
    <div className='propuestasini'>
      <Pantalla
        title="Propuestas"
        one={<p className='pludi'>
          En ludidactas hemos diseñado distintas propuestas de aprendizaje: <span className="text-[#46BFD7]">propuestas técnicas, propuestas didácticas y propuestas pedagógicas.</span>

          Esto quiere decir que <span className="text-[#46BFD7]">tanto si eres profe o estudiante, ¡puedes formarte con nosotros!</span>

          Te invitamos a que conozcas nuestras líneas de contenido y las distintas modalidades que hemos creado para vos.
        </p>}
        two={<Imagenes />}
        btn={
          <Link className="custom-btn btn-15 w-fit" href="/propuestas">
            {' '}
            Ver propuestas{' '}
          </Link>
        }
        scroll={
          <Scroll to="recursosini" smooth={true} duration={500}><CircleChevronDown className="w-full h-full" /></Scroll>

        } />

    </div>

  )

}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoPropuestas.png" alt="Personaje2" width={500} height={500} />
  </div>
)
