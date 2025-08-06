'use client'
import ConvocatoriaSvg from '@/svg/dist/bannervcabrera.svg'
import BtnSketchySvg from '../custom/ld-btn-sketchy-svg'
import { LdSvg } from '../custom/ld-svg'

export default function LdBannerVCabrera({ className }: { className?: string }) {
  const boton = (
    <div className="w-full h-full flex items-center justify-center">
      <BtnSketchySvg href="https://www.instagram.com/ludidactas" className='h-4/5'>
        <p className="text-center text-xl">Inscripción</p>
      </BtnSketchySvg>
    </div>
  )

  const ids = ['mano', 'personajes', 'info', 'fondo', 'slot'] as const

  return (
    <LdSvg
      SvgComponent={ConvocatoriaSvg}
      ids={ids}
      slots={{ slot: boton } as const}
      animation={(nodos, t) => {
        ids.forEach((id, idx) => {
          const nodo = nodos[id]
          nodo.dy(Math.sin(t / 600 + idx) * 0.04)
        })
      }}
      className={`${className ?? ''}`}
    />
  )
}
