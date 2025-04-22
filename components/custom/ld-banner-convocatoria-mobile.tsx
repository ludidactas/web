'use client'
import ConvocatoriaSvg from '@/svg/convocatoria_mobile.svg'
import { LdSvg } from './ld-svg'
import BtnSketchy from './ld-btn-sketchy'

export default function LdBannerConvocatoriaMobile() {
  const mensaje = (
    <div className="flex flex-col items-center h-full justify-around">
      <p className="text-3xl text-center">
        {' '}
        Convocamos a personas interesadas en practicar el rol docente/didáctico/pedagógico y dispuestas a ocupar también
        el de aprendientes{' '}
      </p>
      <p className="text-2xl text-center text-[#93278c]">
        ¡Si estás interesadx, accedé a la info completa y escribinos!
      </p>
      <BtnSketchy className="h-[5em] text-2xl text-center leading-[4em]" href="/convocatoria">
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
          nodo.dy(Math.sin(t / 1000 + idx) * 0.04)
        })
      }}
      // className="border-b-2 border-b-[#94268f]"
    />
  )
}
