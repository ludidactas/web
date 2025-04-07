'use client'

import BtnNeon from '@/components/custom/ld-btn-neon'
import BtnSketchy from '@/components/custom/ld-btn-sketchy'
import { body, titulo } from '@/components/fonts'
import { CircleChevronDown } from 'lucide-react'
import Image from 'next/image'
import { Link as Scroll } from 'react-scroll'

const HeroDesktop = () => {
  return (
    <div
      data-aos="zoom-out"
      data-aos-duration="1000"
      className="heroini self-center w-[1300px] border-solid border-4 border-black rounded-xl flex gap-2 p-5 items-center text-xl bg-gradient-to-r from-cyan-500/50 to-blue-500/50"
    >
      {/* <Image
        className="[animation:bounce_2s_infinite]"
        width={300}
        height={300}
        src={'/img/CONVOCATORIA.png'}
        alt={''}
      /> */}
      <div className={`${body.className} flex gap-2 p-6 bg-white border-4 border-black border-dashed rounded-xl`}>
        {/* Banner convocatoria */}
        <div className="flex items-center flex-col ">
          <p className="text-left m-0 text-3xl p-8">
            Convocamos a personas interesadas en <span className="font-bold">practicar</span> el rol
            docente/didáctico/pedagógico y dispuestas a ocupar también el de aprendientes.
          </p>
          <p className="text-3xl text-indigo-500 mb-6">¡Si estás interesadx, accedé a la info completa y escribinos!</p>

          <BtnSketchy className="w-40 h-20 text-2xl text-center leading-[56px]" href="/convocatoria">
            Convocatoria
          </BtnSketchy>
        </div>

        <Image
          className="rounded-full w-fit border-2 shadow-xl"
          src="/img/Grupo.webp"
          alt=""
          width={150}
          height={150}
        />
      </div>
    </div>
  )
}

const HeroMobile = () => {
  return (
    <div
      data-aos-duration="1000"
      className="flex flex-col items-center h-[93vh] justify-center gap-8 border-solid border-2 border-black rounded-xl p-4 bg-gradient-to-r from-cyan-500/50 to-blue-500/50"
    >
      {/* Banner convocatoria */}
      <div
        className={`${titulo.className} h-[85vh] flex flex-col items-center justify-around gap-2 p-4 bg-white border-2 border-black border-dashed rounded-xl`}
      >
        <Image className="w-[45vW]" width={400} height={400} src={'/img/CONVOCATORIA.png'} alt={''} />
        <p className="text-2xl text-center p-4">
          Convocamos a personas interesadas en <span className="font-bold">practicar</span> el rol
          docente/didáctico/pedagógico y dispuestas a ocupar también el de aprendientes.
        </p>
        <h3 className="text-3xl p-4 text-center bg-yellow-100 border-4 border-dashed border-black rounded-xl">
          ¡Si estás interesadx, accedé a la info completa y escribinos!
        </h3>

        <BtnNeon className="w-[35vw] text-center" href="/convocatoria">
          Convocatoria
        </BtnNeon>
      </div>
      <div className="w-[8vw] my-10">
        <Scroll to="portadaini" smooth={true} duration={500}>
          <CircleChevronDown className="animate-bounce bg-white rounded-full w-full h-full" />
        </Scroll>
      </div>
    </div>
  )
}

const Hero = () => {
  return (
    <>
      <div className="block lg:hidden">
        <HeroMobile />
      </div>
      <div className="hidden lg:block">
        <HeroDesktop />
      </div>
    </>
  )
}

export default Hero
