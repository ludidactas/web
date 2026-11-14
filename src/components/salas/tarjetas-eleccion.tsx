import { cn } from '@/lib/utils'
import type { OpcionSala } from './opciones-sala'

/**
 * Grupo de tarjetas de elección única, pegadas como un solo control segmentado: elegir una deselecciona
 * las demás. Cada tarjeta lleva ícono a la izquierda y, a su lado, título y descripción. En pantallas
 * anchas van en una fila; en las angostas, una debajo de otra. Es un `radiogroup`, así que se navega
 * con las flechas.
 */
export function TarjetasEleccion<T extends string>({
  legend,
  valor,
  opciones,
  onChange,
  deshabilitado,
}: {
  legend: string
  valor: T
  opciones: Record<T, OpcionSala>
  onChange: (valor: T) => void
  deshabilitado?: boolean
}) {
  const claves = Object.keys(opciones) as T[]

  return (
    <div role="radiogroup" aria-label={legend} className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{legend}</p>
      <div className="grid grid-cols-1 xl:grid-cols-3 overflow-hidden rounded-lg border border-slate-200 divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
        {claves.map((clave, i) => {
          const { titulo, descripcion, icono: Icono } = opciones[clave]
          const elegida = clave === valor
          return (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={elegida}
              disabled={deshabilitado}
              tabIndex={elegida || (!claves.includes(valor) && i === 0) ? 0 : -1}
              onClick={() => onChange(clave)}
              onKeyDown={(e) => {
                const paso =
                  e.key === 'ArrowRight' || e.key === 'ArrowDown'
                    ? 1
                    : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                      ? -1
                      : 0
                if (!paso) return
                e.preventDefault()
                onChange(claves[(i + paso + claves.length) % claves.length])
              }}
              className={cn(
                // El radio de las puntas es el del contenedor menos su borde, para que el anillo de la elegida siga la curva.
                'flex items-center gap-3 p-3 text-left transition-colors first:rounded-t-[calc(var(--radius)-1px)] last:rounded-b-[calc(var(--radius)-1px)] xl:first:rounded-bl-[calc(var(--radius)-1px)] xl:first:rounded-tr-none xl:last:rounded-tr-[calc(var(--radius)-1px)] xl:last:rounded-bl-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
                elegida ? 'bg-teal-50 ring-2 ring-inset ring-teal-500' : 'bg-white hover:bg-slate-50',
                deshabilitado && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  elegida ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                <Icono className="h-5 w-5" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold leading-tight">{titulo}</span>
                <span className="text-xs leading-snug text-muted-foreground">{descripcion}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
