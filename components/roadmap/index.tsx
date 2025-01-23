'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Componente que engloba el svg con interacciones y el preview del contenido,
 * que sale lado a lado o dentro de un drawer dependiendo del tamaño de pantalla
 */

import RoadmapDrawer from '@/components/custom/ld-drawer'
import LdMateria from '@/components/custom/ld-materia'
import FadeTransition from '@/components/fx/transition'
import SvgRoadmap from '@/components/roadmap/svg'
import { useMediaQuery } from '@uidotdev/usehooks'
import { useContext, useEffect, useState } from 'react'
import ContextoSvgRoadmap from './context'

export default function MontajeRoadmap() {
  // Media query para saber si usar el cajón o renderizar lado a lado
  const [isDesktop, setIsDesktop] = useState(false)

  // Esto corre en useEffect para suceder solo en el browser
  const esDesktop = useMediaQuery('(min-width: 768px)')
  useEffect(() => {
    setIsDesktop(esDesktop)
  }, [esDesktop])

  const { clicked, setClicked, focused, lastFocused } = useContext(ContextoSvgRoadmap)

  return (
    <div className="flex">
      {/* {clicked ? clicked.toString() : 'null'} */}

      {/* Si no estamos en Desktop, renderizamos en drawer */}
      {!isDesktop && (
        <RoadmapDrawer
          idArticulo={focused ?? lastFocused}
          isOpen={!!clicked}
          setIsOpen={(open) => setClicked(open ? clicked : null)}
        />
      )}

      {/* El svg con event handlers */}
      <SvgRoadmap />

      {/* Si estamos en Desktop, renderizamos lado a lado */}
      {isDesktop && (
        <div className="h-full w-full">
          <FadeTransition show={!!focused || !!clicked}>
            <div className="w-full">{/* <LdMateria materia={focused ?? lastFocused} /> */}</div>
          </FadeTransition>
        </div>
      )}
    </div>
  )
}
