import { cn } from '@/lib/utils'
import Mano from '@/svg/dist/ilustraciones/mano.svg'
import { LdSvg } from './ld-svg'

const ids = ['mano', 'brillos'] as const

// Punto (en el sistema de coordenadas del svg) donde el brazo sale del borde inferior:
// es el eje sobre el que gira la mano, como si saliera de cuadro.
const PIVOTE = { x: 74.449, y: 317.578 }

const PERIODO = 3000 // ms que tarda un barrido completo (ida y vuelta)
const AMPLITUD = 8 // grados que se inclina la mano a cada lado desde el centro
const UMBRAL_TOQUE = 3 // grados de tolerancia alrededor del centro para considerar que el dedo "toca" el cuadro

/** Mano que se mece de izquierda a derecha sobre su base; al pasar por el centro,
 * donde el dedo índice queda sobre el cuadro, aparecen los brillos.
 * Necesita overflow visible: al rotar, la mano sobresale del viewBox del svg. */
export default function LdMano({ className }: { className?: string }) {
  return (
    <LdSvg
      className={cn('overflow-visible', className)}
      SvgComponent={Mano}
      ids={ids}
      animation={(nodos, t) => {
        const angulo = AMPLITUD * Math.sin((2 * Math.PI * t) / PERIODO)
        nodos.mano.transform({ rotate: angulo, ox: PIVOTE.x, oy: PIVOTE.y })
        nodos.brillos.attr({ opacity: Math.max(0, 1 - Math.abs(angulo) / UMBRAL_TOQUE) })
      }}
    />
  )
}
