'use client'
import Roadmap from '@/components/roadmap'
import RoadmapDrawer from '@/components/custom/ld-drawer'
import { useEffect, useState } from 'react'
import { capitalize, entries } from 'remeda'
import { getArticulo } from '@/md'

export default function Page() {
  // Estado del drawer
  const [isCajonAbierto, setIsCajonAbierto] = useState(false)

  // Nombre del artículo que se halla clickeado
  const [clicked, setClicked] = useState<null | string>(null)

  const [focused, setFocused] = useState<null | string>(null)

  const [meta, setMeta] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (focused) {
      const [_, meta] = getArticulo(focused)
      setMeta(meta)
    }
  }, [focused])

  return (
    <div className="flex">
      {/* Si `clicked` está definida, renderizamos el drawer */}
      {clicked && <RoadmapDrawer articulo={clicked} isOpen={isCajonAbierto} setIsOpen={setIsCajonAbierto} />}
      <Roadmap onClick={(id) => setClicked(id)} onFocus={(id) => setFocused(id)} onUnfocus={(id) => setFocused(null)} />
      <div className="h-full">
        {focused && meta && (
          <>
            <h2 className="text-2xl">{capitalize(focused)}</h2>
            {entries(meta).map(([k, v]) => (
              <p key={k}>
                <b>{capitalize(k)}:</b> {v}
              </p>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
