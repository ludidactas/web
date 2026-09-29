import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SwitchCard } from '@/components/ui/switch-card'
import { cn, plural } from '@/lib/utils'
import {
  ETIQUETAS_FORMA_DE_EVALUACION,
  FormaEvaluacionAsistencia,
  MINUTOS_MAXIMOS,
  type CondicionAsistencia,
} from '@/wss/validators/asistencia'

/** Condición con la que queda la lista de asistencia al encenderla; el profe la ajusta después. */
const CONDICION_POR_DEFECTO: CondicionAsistencia = {
  forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
  minutos_minimos: 45,
}

/** Minutos con los que arranca el input al pasar de "Se conectó en algún momento" a una forma que sí pide un umbral. */
const MINUTOS_POR_DEFECTO = 45

/** Presets del dropdown de minutos. Son atajos para los valores más comunes, no una restricción: el
 * profe puede tipear cualquier otro valor con "Personalizado". */
const PRESETS_MINUTOS = [15, 30, 45, 60, 90, 120] as const

/** El texto exacto de qué significa la condición elegida, con los valores concretos ya adentro. */
function descripcionCondicion(condicion: CondicionAsistencia): string {
  switch (condicion.forma_evaluacion) {
    case FormaEvaluacionAsistencia.TotalMinutos: {
      const n = condicion.minutos_minimos
      return `Un estudiante queda presente si estuvo conectado, en total, al menos ${n} ${plural(
        n,
        'minuto',
        'minutos'
      )} durante la clase — no hace falta que sea seguido, cuenta la suma de todos los tramos conectados.`
    }
    case FormaEvaluacionAsistencia.UltimosMinutos: {
      const n = condicion.minutos_minimos
      return `Un estudiante queda presente si estuvo conectado durante los últimos ${n} ${plural(
        n,
        'minuto',
        'minutos'
      )} de la clase, sin importar si estuvo conectado antes o no.`
    }
    case FormaEvaluacionAsistencia.Conectado:
      return 'Un estudiante queda presente con haberse conectado en algún momento de la clase, aunque sea un instante.'
  }
}

/** Dropdown de minutos con presets + "Personalizado" (input libre). Arranca en modo personalizado si
 * el valor recibido no es uno de los presets (ej: viene de una sala vieja con otro valor guardado). */
function SelectorMinutos({ minutos, onChange }: { minutos: number; onChange: (minutos: number) => void }) {
  const [personalizado, setPersonalizado] = useState(!(PRESETS_MINUTOS as readonly number[]).includes(minutos))

  const [texto, setTexto] = useState(String(minutos))
  useEffect(() => setTexto(String(minutos)), [minutos])

  if (personalizado) {
    const n = Number(texto)
    const invalido = texto === '' || n < 1 || n > MINUTOS_MAXIMOS

    return (
      <div className={cn('flex flex-col gap-1')}>
        <div className={cn('flex items-center gap-2')}>
          <label
            className={cn(
              'flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm bg-white',
              invalido && 'border-red-400'
            )}
          >
            <input
              type="text"
              inputMode="numeric"
              value={texto}
              onChange={(e) => {
                const digitos = e.target.value.replace(/\D/g, '')
                setTexto(digitos)
                const nuevo = Number(digitos)
                if (digitos !== '' && nuevo >= 1 && nuevo <= MINUTOS_MAXIMOS) onChange(nuevo)
              }}
              className={cn('w-12 text-center outline-none')}
            />
            min
          </label>
          <button
            type="button"
            className={cn('text-xs text-slate-500 underline underline-offset-2')}
            onClick={() => setPersonalizado(false)}
          >
            usar un preset
          </button>
        </div>
        {invalido && <p className={cn('text-xs text-red-500')}>Tiene que ser entre 1 y {MINUTOS_MAXIMOS} minutos.</p>}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('w-24 border rounded-lg px-3 py-1.5 text-sm text-left bg-white')}>
        {minutos} min
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={String(minutos)}
          onValueChange={(valor) => (valor === 'personalizado' ? setPersonalizado(true) : onChange(Number(valor)))}
        >
          {PRESETS_MINUTOS.map((n) => (
            <DropdownMenuRadioItem key={n} value={String(n)}>
              {n} min
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value="personalizado">Personalizado…</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Switch + selects de la condición de asistencia. `condicion: null` = lista apagada. Es compartido:
 * el form de creación de la sala lo maneja con estado local y el panel de config con el store.
 */
export function SelectorCondicionDeAsistencia({
  condicion,
  onChange,
}: {
  condicion: CondicionAsistencia | null
  onChange: (condicion: CondicionAsistencia | null) => void
}) {
  /** Cambia la forma de evaluación, construyendo la forma exacta que le corresponde: solo
   * `total_minutos`/`ultimos_minutos` llevan `minutos_minimos`. */
  const cambiarForma = (forma: FormaEvaluacionAsistencia) => {
    if (!condicion) return
    if (forma === FormaEvaluacionAsistencia.Conectado) {
      onChange({ forma_evaluacion: forma })
    } else {
      const minutosPrevios = 'minutos_minimos' in condicion ? condicion.minutos_minimos : MINUTOS_POR_DEFECTO
      onChange({ forma_evaluacion: forma, minutos_minimos: minutosPrevios })
    }
  }

  return (
    <>
      <SwitchCard
        title="Lista de asistencia"
        description="Registra automaticamente la asistencia de la sala en tu drive al retirarte"
        checked={!!condicion}
        onCheckedChange={(checked) => onChange(checked ? condicion ?? CONDICION_POR_DEFECTO : null)}
      />

      <AnimatePresence initial={false}>
        {condicion && (
          <motion.div
            key="asistencia-detalle"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', width: '100%' }}
            className={cn('flex flex-col gap-2')}
          >
            <p className="text-sm text-slate-500 px-2 ">Criterio de asistencia:</p>
            <div className={cn('flex gap-2')}>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn('flex-1 border rounded-lg px-3 py-1.5 text-sm text-left bg-white')}>
                  {ETIQUETAS_FORMA_DE_EVALUACION[condicion.forma_evaluacion]}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={condicion.forma_evaluacion}
                    onValueChange={(forma) => cambiarForma(forma as FormaEvaluacionAsistencia)}
                  >
                    {Object.entries(ETIQUETAS_FORMA_DE_EVALUACION).map(([forma, label]) => (
                      <DropdownMenuRadioItem key={forma} value={forma}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {condicion.forma_evaluacion !== FormaEvaluacionAsistencia.Conectado && (
                <SelectorMinutos
                  minutos={condicion.minutos_minimos}
                  onChange={(minutos_minimos) => onChange({ ...condicion, minutos_minimos })}
                />
              )}
            </div>
            <p className="text-xs text-slate-400 px-2">{descripcionCondicion(condicion)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
