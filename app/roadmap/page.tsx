'use client'
import { LibretaProvider } from '@/components/context/libreta'
import RoadmapDrawer from '@/components/custom/ld-drawer'
import FadeTransition from '@/components/fx/transition'
import Roadmap from '@/components/roadmap'
import Radar from '@/components/ui/radar'
import { getMateria, Materia } from '@/md'
import { Meta } from '@/md/schema'
import { useEffect, useState } from 'react'
import { capitalize, entries, isObjectType } from 'remeda'

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
    console.log(`seteando cajonabierto`)
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
            setClicked(null)
          }}
        />

        <Roadmap
          onClick={(id) => setClicked((clicked) => (id === clicked ? null : id))}
          onFocus={(id) => setFocused(id)}
          onUnfocus={() => setFocused(null)}
        />
        <div className="h-full">
          <FadeTransition show={panelVisible}>
            <>
              <h2 className="text-2xl">{meta.titulo}</h2>
              {entries(meta).map(([k, v]) => (
                <div key={k}>
                  <b>{capitalize(k)}:</b> {isObjectType(v) ? <pre>{JSON.stringify(v, null, 2)}</pre> : <p>{v}</p>}
                </div>
              ))}
              {meta.stats && <Radar stats={meta.stats} />}
            </>
          </FadeTransition>
        </div>
      </div>
    </LibretaProvider>
  )
}
