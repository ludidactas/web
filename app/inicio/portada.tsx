'use client'
import { titulo } from '@/components/fonts'
import { CircleChevronDown } from 'lucide-react'
import Image from 'next/image'
import { Link } from 'react-scroll'

const PortadaDesktop = () => {
  return (
    <div className="portadaini flex mb-20 flex-col items-center ">
      <Image className="mt-10" src="/img/Compo.png" alt="PortadaImg" width={700} height={700} />
      <h3 className="mx-80 mb-80 text-3xl text-center">
        {' '}
        <span className="text-[#4198AA]">Participá</span> de la regeneración de la{' '}
        <span className="text-[#4198AA]">educación</span> entrenando el <span className="text-[#4198AA]">arte</span> que
        amás en una <span className="text-[#4198AA]">comunidad</span> de práctica.
      </h3>
      <div className="w-10">
        <Link to="identidadini" smooth={true} duration={500}>
          <CircleChevronDown className=" bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4] w-full h-full" />
        </Link>
      </div>
    </div>
  )
}

const PortadaMobile = () => {
  return (
    <div className="portadaini w-[100vw] h-[100vh] flex flex-col place-content-center items-center">
      <Image className="pt-10 w-[80vw]" src="/img/Compo.png" alt="PortadaImg" width={1000} height={1000} />
      <h3 className={`${titulo.className} text-2xl text-center p-10`}>
        {' '}
        <span className="text-[#4198AA]">Participá</span> de la regeneración de la{' '}
        <span className="text-[#4198AA]">educación</span> entrenando el <span className="text-[#4198AA]">arte</span> que
        amás en una <span className="text-[#4198AA]">comunidad</span> de práctica.
      </h3>
      <Link to="identidadini" smooth={true} duration={500}>
        <CircleChevronDown className="mt-8 bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4]" />
      </Link>
    </div>
  )
}

const Portada = () => {
  return (
    <>
      <div className="block lg:hidden w-[100vw] h-[100vh]">
        <PortadaMobile />
      </div>
      <div className={'hidden lg:block w-[100vw] h-[100vh]'}>
        <PortadaDesktop />
      </div>
    </>
  )
}

export default Portada
