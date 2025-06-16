'use client'
import ConvocatoriaSvg from '@/svg/dist/bannervcabrera.svg'
import BtnSketchy2 from './ld-btn-sketchy-2'
import { LdSvg } from './ld-svg'

export default function LdBannerVCabrera({ className }: { className?: string }) {
  const boton = (
    <div className="w-full h-full flex items-center justify-center">
      <BtnSketchy2 href="https://www.instagram.com/ludidactas" className='h-4/5'>
        <p className="text-center text-xl">Inscripción</p>
      </BtnSketchy2>
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
