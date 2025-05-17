'use client'
import LdBanner from '@/components/custom/ld-banner-convocatoria'
import { LdSvg } from '@/components/custom/ld-svg'
import CajaTexto from '@/svg/CajaTextoPre.svg'

export default function Page() {
  const one = <p>Tuvieja</p>

  return (
    <div className="h-screen w-4/5 mx-auto">
      <LdBanner />

      <LdSvg
        className="text-2xl w-full"
        SvgComponent={CajaTexto}
        ids={['cajaUno', 'cajaDos'] as const}
        animation={(t, nodos) => {
          const i = 500
          nodos['cajaUno'].attr({ opacity: t % i < i / 2 ? 1 : 0 })
          nodos['cajaDos'].attr({ opacity: t % i > i / 2 ? 1 : 0 })
        }}
        slots={{ slotCaja: one } as const}
      />
    </div>
  )
}
