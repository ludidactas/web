import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import Go from '@/svg/dist/ilustraciones/Go.svg'
import { LdSvg } from './ld-svg'

const ids = ['colaIzq', 'colaDer'] as const

// Puntos (en el sistema de coordenadas del svg) donde cada cola nace del cuerpo del gato:
// son los ejes sobre los que giran, como si el resto del gato quedara fijo.
const PIVOTE_IZQ = { x: 355.543, y: 405.642 }
const PIVOTE_DER = { x: 1346.54, y: 451.157 }

const PERIODO = 2600 // ms que tarda un barrido completo (ida y vuelta)
const AMPLITUD = 6 // grados que se inclina cada cola a cada lado desde el centro
const DESFASE = 650 // ms de desfase entre colas, para que no se muevan sincronizadas

const N_PIEDRAS = 16
const DURACION_EXPLOSION = 900 // ms, debe matchear la duración de la animación en tailwind.config

// Cooldown entre explosiones al mover el mouse, para que se sientan continuas al recorrer todo
// el svg sin spamear una explosión por cada pixel de movimiento.
const COOLDOWN_EXPLOSION = 220 // ms

/** Ilustración de los gatos jugando al Go, con las colas meciéndose de lado a lado sobre su
 * base, y una explosión de piedras (blancas y negras) detrás, centrada en cualquier punto del
 * dibujo donde se pase el mouse por encima. */
export default function LdGo({ className }: { className?: string }) {
  const [explosiones, setExplosiones] = useState<{ key: number; x: number; y: number }[]>([])
  const ultimaRef = useRef(0)

  const dispararExplosion = (x: number, y: number) => {
    const key = Date.now() + Math.random()
    setExplosiones((prev) => [...prev, { key, x, y }])
    setTimeout(() => {
      setExplosiones((prev) => prev.filter((e) => e.key !== key))
    }, DURACION_EXPLOSION)
  }

  // Dispara una explosión en la posición del mouse (relativa al contenedor), respetando un
  // cooldown para no generar una explosión por cada pixel de movimiento.
  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const ahora = Date.now()
    if (ahora - ultimaRef.current < COOLDOWN_EXPLOSION) return
    ultimaRef.current = ahora

    const rect = e.currentTarget.getBoundingClientRect()
    dispararExplosion(e.clientX - rect.left, e.clientY - rect.top)
  }

  return (
    <div className={cn('relative', className)} onMouseEnter={handleHover} onMouseMove={handleHover}>
      {explosiones.map(({ key, x, y }) => (
        <ExplosionPiedras key={key} x={x} y={y} />
      ))}

      <LdSvg
        className="relative z-10 overflow-visible"
        SvgComponent={Go}
        ids={ids}
        animation={(nodos, t) => {
          const anguloIzq = AMPLITUD * Math.sin((2 * Math.PI * t) / PERIODO)
          const anguloDer = AMPLITUD * Math.sin((2 * Math.PI * (t + DESFASE)) / PERIODO)
          nodos.colaIzq.transform({ rotate: anguloIzq, ox: PIVOTE_IZQ.x, oy: PIVOTE_IZQ.y })
          nodos.colaDer.transform({ rotate: anguloDer, ox: PIVOTE_DER.x, oy: PIVOTE_DER.y })
        }}
      />
    </div>
  )
}

function ExplosionPiedras({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-0" style={{ left: x, top: y }}>
      {Array.from({ length: N_PIEDRAS }, (_, i) => {
        const angulo = (360 / N_PIEDRAS) * i + (Math.random() * 14 - 7)
        const distancia = 70 + Math.random() * 60
        const negra = i % 2 === 0
        return (
          <span
            key={i}
            className={cn(
              'absolute left-0 top-0 h-3 w-3 rounded-full animate-explosion-piedra',
              negra ? 'bg-neutral-900' : 'bg-white border border-neutral-400'
            )}
            style={
              {
                '--angulo': `${angulo}deg`,
                '--distancia': `${distancia}px`,
                animationDelay: `${i * 10}ms`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
