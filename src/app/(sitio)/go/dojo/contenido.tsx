'use client'

import { Icon } from '@iconify/react/dist/iconify.js'
import { ConjuntoDesafios } from '@/lib/go-dojo/components/conjunto-desafios'
import type { Desafio } from '@/lib/go-dojo/tipos'

/** Mismo lenguaje visual que el resto de Go en el sitio (`go-estudiante.tsx`, `go-juego.tsx`): título
 * en `ld-violeta-oscuro` con ícono, tarjeta blanca redondeada — no la tipografía/paleta "editorial"
 * del resto del sitio marketing. */
export default function ContenidoDojoGo({ challenges }: { challenges: Desafio[] }) {
  return (
    <div className="flex flex-col w-full max-w-6xl px-4 md:px-8 pt-16 pb-32 md:pb-40">
      <h1 className="flex gap-2 items-center justify-center text-3xl md:text-5xl font-medium text-ld-violeta-oscuro mb-4">
        <Icon className="-rotate-3" icon="bi:grid-3x3" />
        Dojo de Go
      </h1>
      <p className="text-center text-slate-500 mb-12">
        Resolvé los problemas en orden. Cada uno te muestra una posición del tablero: encontrá la jugada correcta.
      </p>
      <div className="w-full bg-white rounded-xl p-6 md:p-10 shadow-sm">
        <ConjuntoDesafios desafios={challenges} showFilters={false} />
      </div>
    </div>
  )
}
