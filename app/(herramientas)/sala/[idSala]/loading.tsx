'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import { cn } from '@/lib/utils'
import loadingEst from '@/svg/loading2SVGO.svg'
import { animate, spring, stagger } from 'animejs'

interface LoadingSalaProps {
  overlay?: boolean
}

export default function LoadingSalaEstudiante({ overlay = false }: LoadingSalaProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-gradient-to-r from-cyan-500/70 to-indigo-500/70',
        overlay
          ? 'fixed inset-0 z-50 h-screen w-screen' // Cubre header y todo lo demás
          : 'h-screen w-screen' // Default (en loading.tsx)
      )}
    >
      <p className="text-5xl text-white">Cargando...</p>
      <LdSvg
        className="w-80 h-80"
        SvgComponent={loadingEst}
        ids={['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho'] as const}
        animate={(nodos) => () => {
          animate([nodos.uno, nodos.dos, nodos.tres, nodos.cuatro, nodos.cinco, nodos.seis, nodos.siete, nodos.ocho], {
            scale: [
              { to: 1.02, ease: 'inOut(3)', duration: 200 },
              { to: 1, ease: spring({ bounce: 0.8 }) },
            ],
            delay: stagger(100),
            loop: true,
          })
        }}
      />
    </div>
  )
}
