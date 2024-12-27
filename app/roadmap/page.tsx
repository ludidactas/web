'use client'
import Roadmap from '@/components/roadmap'
import RoadmapDrawer from '@/components/custom/ld-drawer'
import { useEffect, useState } from 'react'
import { capitalize, entries, isObjectType } from 'remeda'
import { Articulo, getArticulo } from '@/md'
import FadeTransition from '@/components/fx/transition'
import Radar from '@/components/ui/radar'

export default function Page() {
  // Estado del drawer
  const [isCajonAbierto, setIsCajonAbierto] = useState(false)

  // Nombre del artículo que se halla clickeado
  const [clicked, setClicked] = useState<Articulo>(Articulo.Programacion)
  const [focused, setFocused] = useState<Articulo | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)

  // Programación como default
  const [_, metaProg] = getArticulo(Articulo.Programacion)
  const [meta, setMeta] = useState<Record<string, any>>(metaProg!)

  useEffect(() => {
    setPanelVisible(!!focused)
    if (focused) {
      // Mostramos el contenido
      setPanelVisible(true)

      // Seteamos los metadatos para este artículo
      const [_, meta] = getArticulo(focused)
      if (meta) setMeta(meta)
    }
  }, [focused])

  return (
    <div className="flex">
      {/* Si `clicked` está definida, renderizamos el drawer */}
      {clicked && <RoadmapDrawer articulo={clicked} isOpen={isCajonAbierto} setIsOpen={setIsCajonAbierto} />}
      <Roadmap onClick={(id) => setClicked(id)} onFocus={(id) => setFocused(id)} onUnfocus={() => setFocused(null)} />
      <div className="h-full">
        <FadeTransition show={panelVisible}>
          <>
            <h2 className="text-2xl">{meta.titulo}</h2>
            {entries(meta).map(([k, v]) => (
              <div key={k}>
                <b>{capitalize(k)}:</b> {isObjectType(v) ? <pre>{JSON.stringify(v, null, 2)}</pre> : <p>{v}</p>}
              </div>
            ))}
            <Radar stats={meta.stats} />
          </>
        </FadeTransition>
      </div>
    </div>
  )
}
