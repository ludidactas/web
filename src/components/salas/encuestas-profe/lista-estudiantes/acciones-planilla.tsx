import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Icon } from '@iconify/react/dist/iconify.js'

import useClipboard from '@/components/hooks/use-clipboard'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, exportarPlanillaCompleta } from '@/lib/utils'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storeEstudiantes, type Estudiante } from '@/wss-cli/stores/estudiantes-store'

/** Acciones sobre la lista completa: filtrar por conectados, copiarla como texto, y exportar la
 * planilla completa (incluye a quienes ya no están conectados en este navegador). */
export function AccionesPlanilla({
  visibles,
  soloConectados,
  onAlternar,
}: {
  visibles: Estudiante[]
  soloConectados: boolean
  onAlternar: () => void
}) {
  const { pedirPlanillaCompleta } = useConexionProfe()
  const { items: estudiantes } = storeEstudiantes()
  const { config: configSala } = storeConfig()
  const [exportandoPlanilla, startExportarPlanilla] = useTransition()
  const [minutosVentana, setMinutosVentana] = useState(90)

  const { handleCopy, justCopied } = useClipboard()

  // Export local: recuperar cuando haya cuentas "full"
  // const handleExportToExcel = () => {
  //   const datosParaExcel = estudiantes.map((e) => ({
  //     Nombre: e.nombre || 'Sin nombre',
  //     Email: e.email || 'Sin email',
  //     DNI: e.dni || 'Sin DNI',
  //   }))

  //   exportarPlanilla(datosParaExcel)
  // }

  /** Exporta la planilla completa desde el estado del servidor: incluye a quienes ya no están
   * conectados (o fueron "limpiados" del store del FE) y una columna por cada pregunta con la
   * respuesta de cada estudiante. A diferencia de `handleExportToExcel`, no depende de lo que este
   * navegador haya visto en la sesión actual. */
  const handleExportarPlanillaCompleta = () =>
    startExportarPlanilla(async () => {
      try {
        const planilla = await pedirPlanillaCompleta(minutosVentana)

        if (!configSala) return

        if (planilla.filas.length === 0) {
          toast.info(
            estudiantes.length === 0
              ? 'Todavía no hay estudiantes registrados en esta sala'
              : `Nadie estuvo conectado en los últimos ${minutosVentana} minutos`
          )
          return
        }

        exportarPlanillaCompleta(planilla, configSala)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo generar la planilla')
      }
    })

  const datosEstudiantes = visibles
    .map((e) => {
      const identificador = e.email || e.dni
      return identificador ? `${e.nombre} (${identificador})` : e.nombre
    })
    .join('\n')

  return (
    <div className={cn('flex justify-end gap-2 mb-3 text-ld-violeta-oscuro')}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
              soloConectados ? 'bg-ld-violeta-oscuro text-white border-ld-violeta-oscuro' : 'hover:bg-slate-50'
            )}
            onClick={onAlternar}
            disabled={estudiantes.length === 0}
          >
            <Icon icon="lucide:users" width={14} height={14} /> Solo conectados
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Mostrar solo los estudiantes conectados ahora</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
              justCopied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'hover:bg-slate-50'
            )}
            onClick={handleCopy(datosEstudiantes)}
            disabled={visibles.length === 0}
          >
            {justCopied ? (
              <Icon icon="lucide:square-check-big" width={14} height={14} />
            ) : (
              <Icon icon="lucide:copy" width={14} height={14} />
            )}
            {justCopied ? '¡Copiado!' : 'Copiar'}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Copiá la lista de participantes</p>
        </TooltipContent>
      </Tooltip>
      {/* Cuando tengamos cuentas "full" volvemos a habilitar expor */}
      {/* <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
            onClick={handleExportToExcel}
            disabled={estudiantes.length === 0}
          >
            <Download size={14} /> Exportar
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Exportá la lista a Excel</p>
        </TooltipContent>
      </Tooltip> */}
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                )}
                disabled={exportandoPlanilla || estudiantes.length === 0}
              >
                <Icon icon="lucide:file-spreadsheet" width={14} height={14} />{' '}
                {exportandoPlanilla ? 'Generando...' : 'Exportar'}
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Exportá la lista a Excel</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="flex flex-col items-center gap-3">
          <DialogHeader>
            <DialogTitle className="text-center leading-6">Exportar planilla</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 text-center">
            ¿Cuántos minutos hacia atrás abarca la clase? Solo se van a incluir en la planilla los
            participantes que estuvieron conectados en algún momento de ese intervalo.
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Minutos
            <input
              type="number"
              min={1}
              value={minutosVentana}
              onChange={(e) => setMinutosVentana(Number(e.target.value))}
              className="w-20 border rounded-lg px-2 py-1 text-center"
            />
          </label>
          <DialogFooter className="flex-row justify-center gap-2">
            <DialogClose>
              <p className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm">Cancelar</p>
            </DialogClose>
            <DialogClose asChild>
              <button
                className="flex items-center gap-1 bg-ld-violeta-oscuro text-white px-4 py-2 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExportarPlanillaCompleta}
                disabled={!minutosVentana || minutosVentana <= 0}
              >
                <Icon icon="lucide:file-spreadsheet" width={14} height={14} /> Exportar
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
