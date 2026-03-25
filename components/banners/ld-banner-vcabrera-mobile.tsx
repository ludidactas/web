'use client'
import ConvocatoriaSvg from '@/svg/dist/bannervcabreramobile.svg'
import { LdSvg } from '../custom/ld-svg'
import BtnSketchySvg from '../custom/ld-btn-sketchy-svg'

export default function LdBannerVCabreraMobile({ className }: { className?: string }) {
  const boton = (
    <div className="w-full h-full flex items-center justify-center">
      <BtnSketchySvg href="https://www.instagram.com/ludidactas" className="h-4/5">
        <p className="text-center text-xl">Inscripción</p>
      </BtnSketchySvg>
    </div>
  )

  return (
    <LdSvg
      SvgComponent={ConvocatoriaSvg}
      ids={['mano', 'personajes', 'info', 'fondo', 'slot'] as const}
      slots={{ slot: boton } as const}
      // Función loop
      // animation={(nodos, t) => {
      //   ['mano', 'personajes', 'info', 'fondo', 'slot'].forEach((id, idx) => {
      //     const nodo = nodos[id]
      //     nodo.dy(Math.sin(t / 600 + idx) * 0.04)
      //   })
      // }}
      className={`${className ?? ''}`}
    />
  )
}
