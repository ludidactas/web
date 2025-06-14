'use client'
import ConvocatoriaSvg from '@/svg/dist/bannervcabrera.svg'
import { LdSvg } from './ld-svg'
import BtnSketchy from './ld-btn-sketchy'

export default function LdBannerVCabrera({ className }: { className?: string }) {
  const boton = (
    <div className="w-full h-full flex items-center justify-center">
      <BtnSketchy
        className="h-[80px] padding-2 text-center text-xl leading-[60px]"
        href="https://www.instagram.com/ludidactas"
      >
        Inscripción
      </BtnSketchy>
    </div>
  )

  return (
    <LdSvg
      // El svg importado
      SvgComponent={ConvocatoriaSvg}
      // Los ids que le hayamos puesto a los elementos
      ids={['mano', 'personajes', 'info', 'fondo', 'slot'] as const}
      // Los slots que hayamos dejado, mapeando a su contenido
      slots={{ slot: boton } as const}
      // Función setup
      setup={(nodos) => {
        // Le aplicamos el blend mode al cono
        nodos['mano'].node.style.mixBlendMode = 'divide'
      }}
      // Función loop
      animation={(nodos, t) => {
        ['mano', 'personajes', 'info', 'fondo', 'slot'].forEach((id, idx) => {
          const nodo = nodos[id]
          nodo.dy(Math.sin(t / 600 + idx) * 0.04)
        })
      }}
      className={`${className ?? ''}`}
    />
  )
}
