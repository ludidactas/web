import { AnimatePresence, motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SwitchCard } from '@/components/ui/switch-card'
import { cn } from '@/lib/utils'
import {
  ETIQUETAS_FORMA_DE_EVALUACION,
  FormaEvaluacionAsistencia,
  MINUTOS_MINIMOS_VALIDOS,
  type CondicionAsistencia,
} from '@/wss/validators/asistencia'

/** Condición con la que queda la lista de asistencia al encenderla; el profe la ajusta después. */
const CONDICION_POR_DEFECTO: CondicionAsistencia = {
  forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
  minutos_minimos: 45,
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
  return (
    <>
      <SwitchCard
        title="Lista de asistencia"
        description="Registra automaticamente la asistencia de la sala en tu drive al retirarte"
        checked={!!condicion}
        onCheckedChange={(checked) => onChange(checked ? (condicion ?? CONDICION_POR_DEFECTO) : null)}
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
            <div className={cn('flex gap-2')}>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn('flex-1 border rounded-lg px-3 py-1.5 text-sm text-left bg-white')}>
                  {ETIQUETAS_FORMA_DE_EVALUACION[condicion.forma_evaluacion]}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={condicion.forma_evaluacion}
                    onValueChange={(forma) =>
                      onChange({ ...condicion, forma_evaluacion: forma as FormaEvaluacionAsistencia })
                    }
                  >
                    {Object.entries(ETIQUETAS_FORMA_DE_EVALUACION).map(([forma, label]) => (
                      <DropdownMenuRadioItem key={forma} value={forma}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn('w-24 border rounded-lg px-3 py-1.5 text-sm text-left bg-white')}>
                  {condicion.minutos_minimos} min
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={String(condicion.minutos_minimos)}
                    onValueChange={(minutos) => onChange({ ...condicion, minutos_minimos: Number(minutos) })}
                  >
                    {MINUTOS_MINIMOS_VALIDOS.map((minutos) => (
                      <DropdownMenuRadioItem key={minutos} value={String(minutos)}>
                        {minutos} min
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
