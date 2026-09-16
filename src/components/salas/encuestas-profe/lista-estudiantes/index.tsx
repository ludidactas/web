import DebugPanel from '@/components/ui/debug-panel'
import { cn } from '@/lib/utils'
import { storeEstudiantes } from '@/wss-cli/stores/estudiantes-store'
import { AccionesPlanilla } from './acciones-planilla'
import { CabeceraSala } from './cabecera-sala'
import { ItemEstudiante } from './item-estudiante'

export const ListaEstudiantes = ({ modo = 'encuestas' }: { modo?: 'encuestas' | 'go' }) => {
  const { items: estudiantes } = storeEstudiantes()

  return (
    <div className="relative flex flex-col h-full">
      <DebugPanel classNames={{ button: 'absolute ' }} data={estudiantes} title="Estudiantes en sala" />

      <CabeceraSala />

      {/* Lista de participantes */}
      <div className={cn('flex flex-col flex-1 overflow-hidden mt-4')}>
        <div className={cn('flex-1 max-h-screen overflow-y-auto')}>
          {estudiantes.length === 0 && (
            <>
              <p className="text-slate-400 italic mt-6 text-center">Ningún estudiante conectado aún...</p>
              <p className="text-slate-400 italic px-6 mt-2 text-center">
                ¡Compartí el link de la sala con tus estudiantes para que participen de las encuestas!
              </p>
            </>
          )}

          {estudiantes.length > 0 && (
            <ul className="flex flex-col gap-2 p-2 rounded-xl">
              {estudiantes.map((e) => (
                <ItemEstudiante key={e.userId} estudiante={e} modo={modo} />
              ))}
            </ul>
          )}
        </div>

        <AccionesPlanilla />
      </div>
    </div>
  )
}

export { ListaMobile } from './lista-mobile'
