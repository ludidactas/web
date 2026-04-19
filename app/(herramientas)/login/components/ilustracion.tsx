'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import ilustracionProfe from '@/svg/dist/ilustraciones/IlustracionProfe3.svg'
import { oscilar } from '@/lib/animaciones'

export default function Ilustracion() {
  return (
    <LdSvg
      className="w-[500px] md:w-[600px] drop-shadow-xl"
      SvgComponent={ilustracionProfe}
      ids={['uno', 'dos', 'tres', 'cuatro'] as const}
      animation={oscilar(['uno', 'cuatro', 'tres'], 2, 0.2, 0.2)}
    />
  )
}
