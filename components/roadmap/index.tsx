'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Componente que engloba el svg con interacciones y el preview del contenido,
 * que sale lado a lado o dentro de un drawer dependiendo del tamaño de pantalla
 */

// Útil https://react-typescript-cheatsheet.netlify.app
// Útil react-hook-form.com
// Pendiente https://github.com/7PH/powerglitch

import { LibretaProvider } from '@/components/context/libreta'
import RoadmapDrawer from '@/components/custom/ld-drawer'
import LdMateria from '@/components/custom/ld-materia'
import FadeTransition from '@/components/fx/transition'
import Roadmap, { RoadmapEvent } from '@/components/roadmap/svg'
import { Materia } from '@/md'
import { useCallback, useState } from 'react'
import { usePrevious, useMediaQuery } from '@uidotdev/usehooks'

export default function MontajeRoadmap() {
  // Media query para saber si usar el cajón o renderizar lado a lado
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Interacciones directas
  const [clicked, setClicked] = useState(false)
  const [focused, setFocused] = useState<Materia | null>(null)
  const lastFocused = usePrevious(focused)

  const onClick: RoadmapEvent = useCallback(() => {
    setClicked(!clicked)
  }, [clicked])
  const onFocus: RoadmapEvent = useCallback((id) => {
    setFocused(id)
  }, [])

  const onUnfocus: RoadmapEvent = useCallback(() => {
    setFocused(null)
  }, [])

  return (
    <LibretaProvider>
      <div className="flex">
        {/* Si no estamos en Desktop, renderizamos en drawer */}
        {!isDesktop && <RoadmapDrawer articulo={focused ?? lastFocused} isOpen={clicked} setIsOpen={setClicked} />}

        {/* El svg con event handlers */}
        <Roadmap onClick={onClick} onFocus={onFocus} onUnfocus={onUnfocus} />

        {/* Si estamos en Desktop, renderizamos lado a lado */}
        {isDesktop && (
          <div className="h-full w-full">
            <FadeTransition show={!!focused || clicked}>
              <div className="w-full">
                <LdMateria materia={focused ?? lastFocused} />
              </div>
            </FadeTransition>
          </div>
        )}
      </div>
    </LibretaProvider>
  )
}
