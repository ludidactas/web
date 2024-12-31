/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { LibretaProvider } from '@/components/context/libreta'
import RoadmapDrawer from '@/components/custom/ld-drawer'
import LdMateria from '@/components/custom/ld-materia'
import FadeTransition from '@/components/fx/transition'
import Roadmap from '@/components/roadmap'
import { getMateria, Materia } from '@/md'
import { Meta } from '@/md/schema'
import { useEffect, useState } from 'react'

export default function Page() {
  // Estado del drawer
  const [isCajonAbierto, setIsCajonAbierto] = useState(false)

  // Nombre del artículo que se halla clickeado
  const [clicked, setClicked] = useState<Materia | null>(null)
  const [focused, setFocused] = useState<Materia | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)

  // Programación como default
  const { meta: metaProg } = getMateria('programacion')
  const [meta, setMeta] = useState<Meta>(metaProg!)

  // Al enfocar una unidad, activar el panel
  useEffect(() => {
    setPanelVisible(!!focused)
    if (focused) {
      // Mostramos el contenido
      setPanelVisible(true)

      // Seteamos los metadatos para este artículo
      const { meta } = getMateria(focused)
      if (meta) setMeta(meta)
    }
  }, [focused])

  // Al clickear una unidad, activar el drawer
  useEffect(() => {
    setIsCajonAbierto(!!clicked)
  }, [clicked])

  return (
    <LibretaProvider>
      <div className="flex">
        <RoadmapDrawer
          articulo={clicked}
          isOpen={isCajonAbierto}
          // Al cerrar el cajón "desclickeamos" el nodo
          setIsOpen={(open) => {
            setIsCajonAbierto(open)
            // setClicked(null)
          }}
        />

        <Roadmap
          onClick={(id) => setClicked((clicked) => (id === clicked ? null : id))}
          onFocus={(id) => setFocused(id)}
          onUnfocus={() => setFocused(null)}
        />
        <div className="h-full w-full">
          <FadeTransition show={panelVisible || !!clicked}>
            <div className="w-full">
              <LdMateria materia={clicked} />
            </div>
          </FadeTransition>
        </div>
      </div>
    </LibretaProvider>
  )
}
