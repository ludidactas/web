'use client'
import { Title } from '@/components/custom/ld-title'
import { DesafioCard } from './desafio-card'
import type { Desafio } from './datos'
import Image from 'next/image'

export default function ContenidoDesafios({ desafios }: { desafios: Desafio[] }) {
  return (
    <>
      <div className="flex flex-col w-full min-h-screen bg-indigo-300">
        <div className="flex my-10 px-2 md:px-20 gap-6">
          <Image
            className="w-24 h-auto md:w-[300px]"
            width={583}
            height={356}
            src={'/desafios/JornadasLogo.png'}
            alt="Logo Jornadas de Recreación"
          />
          <Title
            className=""
            text="Desafíos 24° Jornadas de Recreación"
            color="text-[#8b5cf6]"
            size="text-2xl md:text-5xl md:text-7xl"
          />
        </div>
        <div className="flex flex-col gap-4 mx-4 md:mx-40 p-6 text-xl bg-white/50 rounded-xl">
          <p className="">
            Hemos construido una serie de desafíos para que puedan explorar y familiarizarse con Scratch. Los desafíos
            consisten en pequeños artefactos jugables que no funcionan como se esperaria. Para hacerlos funcionar,
            tendran disponibles algunas pistas y la solución de cada uno. No olviden conversar las posibles soluciones y
            hacer preguntas: aprender es una actividad colectiva
          </p>
          <p className="text-4xl text-[#8b5cf6] text-center"> ¡A explorar!</p>
        </div>

        <div className="flex flex-col items-center px-6 py-10 gap-16 md:gap-2">
          {desafios.map((d) => (
            <DesafioCard key={d.numero} {...d} />
          ))}
        </div>
      </div>
    </>
  )
}
