'use client'
import ConvocatoriaSvg from '@/svg/dist/convocatoria/convocatoria_mobile.svg'
import BtnSketchyGif from '../custom/ld-btn-sketchy-gif'
import { LdSvg } from '../custom/ld-svg'

export default function LdBannerConvocatoriaMobile() {
  const mensaje = (
    <div className="flex flex-col items-center h-full justify-around px-6">
      <p className="text-6xl text-center">
        {' '}
        Convocamos a personas interesadas en practicar el rol docente, didáctico, pedagógico y dispuestas a ocupar
        también el de aprendientes unxs con otrxs{' '}
      </p>
      <p className="text-5xl text-center text-[#93278c]">
        ¡Si estás interesadx, accedé a la info completa y escribinos!
      </p>
      <BtnSketchyGif className="h-[12em] w-[9em] text-6xl text-center leading-[9.5em]" href="/convocatoria">
        Convocatoria
      </BtnSketchyGif>
    </div>
  )

  return (
    <LdSvg
      // El svg importado
      SvgComponent={ConvocatoriaSvg}
      // Los ids que le hayamos puesto a los elementos
      ids={['ld.cono', 'ld.llamada', 'ld.globos', 'ld.fondo', 'ld.slot.contenido'] as const}
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
      animation={(nodos, t) => {
        Object.values(nodos).forEach((nodo, idx) => {
          nodo.y(Math.sin(t / 1000 + idx) * 4)
        })
      }}
      // className="border-b-2 border-b-[#94268f]"
    />
  )
}
