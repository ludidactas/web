'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react/dist/iconify.js'
import { ConjuntoDesafios } from '@/lib/go-dojo/components/conjunto-desafios'
import { CAPITULOS_OGS, type SlugCapituloOgs } from '@/lib/go-dojo/desafios/capitulos'
import type { Desafio } from '@/lib/go-dojo/tipos'
import Image from 'next/image'
import { Outlined } from '@/components/fx/filtros'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Mismo lenguaje visual que el resto de Go en el sitio (`go-estudiante.tsx`, `go-juego.tsx`): título
 * en `ld-violeta-oscuro` con ícono, tarjeta blanca redondeada — no la tipografía/paleta "editorial"
 * del resto del sitio marketing. */
export default function ContenidoDojoGo({ challenges, capitulo }: { challenges: Desafio[]; capitulo: SlugCapituloOgs }) {
  const router = useRouter()
  const [cargando, iniciarCarga] = useTransition()

  // El capítulo vive en la URL (`?capitulo=`): el server baja sus desafíos. `cargando` dura hasta que llegan.
  const elegirCapitulo = (slug: string) => iniciarCarga(() => router.push(`/go/dojo?capitulo=${slug}`, { scroll: false }))

  const siguienteCapitulo = CAPITULOS_OGS[CAPITULOS_OGS.findIndex((c) => c.slug === capitulo) + 1]

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
        <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            Capítulo
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={cargando}
                className="flex-1 md:flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-left text-ld-violeta-oscuro disabled:opacity-50"
              >
                {CAPITULOS_OGS.find((c) => c.slug === capitulo)?.titulo}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={capitulo} onValueChange={elegirCapitulo}>
                  {CAPITULOS_OGS.map((c) => (
                    <DropdownMenuRadioItem key={c.slug} value={c.slug}>
                      {c.titulo}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {cargando && (
              <span
                role="status"
                aria-label="Cargando"
                className="w-4 h-4 rounded-full border-2 border-ld-violeta border-t-transparent animate-spin"
              />
            )}
          </div>
          <p className="text-xs text-slate-500">
            Problemas adaptados de OGS (AGPL-3.0) ·{' '}
            <a
              href="https://github.com/ludidactas/desafios-ogs/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-ld-violeta-oscuro"
            >
              código fuente
            </a>
          </p>
        </div>
        {/* `key`: al cambiar de capítulo el progreso y el desafío actual arrancan de cero. */}
        <ConjuntoDesafios
          key={capitulo}
          desafios={challenges}
          showFilters={false}
          storageKey={`go-dojo-progreso-${capitulo}`}
          onSiguienteCapitulo={siguienteCapitulo && (() => elegirCapitulo(siguienteCapitulo.slug))}
        />
      </div>
    </div>
  )
}
