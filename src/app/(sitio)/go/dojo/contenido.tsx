'use client'

import { Icon } from '@iconify/react/dist/iconify.js'
import { ConjuntoDesafios } from '@/lib/go-dojo/components/conjunto-desafios'
import type { Desafio } from '@/lib/go-dojo/tipos'
import Image from 'next/image'
import { Outlined } from '@/components/fx/filtros'

/** Mismo lenguaje visual que el resto de Go en el sitio (`go-estudiante.tsx`, `go-juego.tsx`): título
 * en `ld-violeta-oscuro` con ícono, tarjeta blanca redondeada — no la tipografía/paleta "editorial"
 * del resto del sitio marketing. */
export default function ContenidoDojoGo({ challenges }: { challenges: Desafio[] }) {
  return (
    <div className="flex flex-col w-full max-w-6xl px-4 md:px-8 pt-16 pb-32 md:pb-40">
      <h1 className="flex gap-2 items-center justify-center text-3xl md:text-8xl p-4 mb-4">
        <Image className='w-52' width={1000} height={1000} src={'/img/dojo.png'} alt={'dojo'} />
        {/* <Icon className="-rotate-3" icon="bi:grid-3x3" /> */}
        {/* <Outlined outlineColor='black' radius={2} className='text-red-600 rounded-xl'>Dojo de Go</Outlined> */}
        Dojo de Go
      </h1>
      <p className="text-center text-slate-600 ">
        Un Dojo es un un <span className='text-black font-bold '>espacio destinado a la práctica y enseñanza. </span></p>
      <p className="text-center text-slate-600">
        ¡Intentá resolver cada uno de los problemas propuestos y practicá con nosotros!</p>
      <p className="text-center text-slate-600 ">
        Cada uno te muestra una posición del tablero: encontrá la jugada correcta.
      </p>
      <div className="w-full bg-white rounded-xl p-6 md:p-10 shadow-sm">
        <ConjuntoDesafios desafios={challenges} showFilters={false} />
      </div>
    </div>
  )
}
