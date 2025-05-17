'use client'
import ConvocatoriaSvg from '@/svg/banner.svg'
import { LdSvg } from './ld-svg'
import BtnSketchy from './ld-btn-sketchy'

export default function LdBannerConvocatoria({ className }: { className?: string }) {
  
  const mensaje = (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-center">
        {' '}
        Convocamos a personas interesadas en practicar el rol docente/didáctico/pedagógico y dispuestas a ocupar también
        el de aprendientes{' '}
      </p>
      <p className="text-xs text-center text-[#93278c]">
        ¡Si estás interesadx, accedé a la info completa y escribinos!
      </p>
      <BtnSketchy className="h-[50px] text-center leading-[30px]" href="/convocatoria">
        Convocatoria
      </BtnSketchy>
    </div>
  )

  return (
    <LdSvg
      // El svg importado
      SvgComponent={ConvocatoriaSvg}
      // Los ids que le hayamos puesto a los elementos
      ids={['ld.cono', 'ld.llamada', 'ld.globos', 'ld.fondo'] as const}
      // Los slots que hayamos dejado, mapeando a su contenido
      slots={
        {
          'ld.slot.contenido': mensaje,
        } as const
      }
      // Función setup
      setup={(nodos) => {
        // Le aplicamos el blend mode al cono
        nodos['ld.cono'].node.style.mixBlendMode = 'screen'
      }}
      // Función loop
      animation={(t, nodos) => {
        Object.values(nodos).forEach((nodo, idx) => {
          nodo.dy(Math.sin(t / 600 + idx) * 0.18)
        })
      }}
      className={`w-4/5 ${className ?? ''}`}
    />
  )
}
