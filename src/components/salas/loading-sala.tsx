'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import loading from '@/svg/dist/ui/loading.svg'
import { Icon } from '@iconify/react'

export interface LoadingSalaProps {
  mensaje?: string
  overlay?: boolean
  error?: boolean
}

export default function LoadingSala({ mensaje, overlay = false, error = false }: LoadingSalaProps) {
  const loadingIcon = (
    <div className="flex flex-col items-center gap-20">
      <p className="text-7xl">Cargando...</p>
      <Icon className="h-60 w-60" icon={'line-md:loading-alt-loop'} />
    </div>
  )

  const errorIcon = (
    <div className="flex flex-col items-center gap-20">
      <p className="text-7xl">¡Ups 🤕!</p>
    </div>
  )

  const botonRecargar = (
    <Button className="mt-4" onClick={() => window.location.reload()}>
      Recargar página
    </Button>
  )

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-ld-gradiente-fondo',
        overlay ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-screen w-screen'
      )}
    >
      <LdSvg
        className="flex w-[300px] md:w-[800px] drop-shadow-xl"
        SvgComponent={loading}
        ids={['slot'] as const}
        slots={
          {
            slot: error ? errorIcon : loadingIcon,
          } as const
        }
      />
      {mensaje && <p>{mensaje}</p>}
      {error && botonRecargar}
    </div>
  )
}
