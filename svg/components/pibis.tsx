'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import { oscilar } from '@/lib/animaciones'
import SvgPibis from '@/svg/dist/identidad/pibis.svg'

export default function Pibis() {
  return (
    <LdSvg
      SvgComponent={SvgPibis}
      ids={['personaje', 'items', 'bg']}
      setup={(nodos) => {
        nodos['items'].node.style.mixBlendMode = 'color'
      }}
      animation={oscilar(['items', 'bg', 'personaje'], 0.5, 0.12, 2)}
    />
  )
}
