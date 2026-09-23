import { useEffect, useState } from 'react'

import DebugPanel from '@/components/ui/debug-panel'
import { cn } from '@/lib/utils'
import { storeEstudiantes } from '@/wss-cli/stores/estudiantes-store'
import { AccionesPlanilla } from './acciones-planilla'
import { CabeceraSala } from './cabecera-sala'
import { ItemEstudiante } from './item-estudiante'

// Preferencia de vista del profe (no estado de la sala): "mostrar solo conectados". Persistida en
// cookie global, igual que `sidebar_state` (ui/sidebar.tsx). El server nunca purga la planilla, así
// que este filtro es puramente cosmético.
const SOLO_CONECTADOS_COOKIE = 'salas_solo_conectados'
const SOLO_CONECTADOS_MAX_AGE = 60 * 60 * 24 * 7 // 7 días, igual que el sidebar

export const ListaEstudiantes = ({ modo = 'encuestas' }: { modo?: 'encuestas' | 'go' }) => {
  const { items: estudiantes } = storeEstudiantes()
  const [soloConectados, setSoloConectados] = useState(false)

  useEffect(() => {
    setSoloConectados(document.cookie.split('; ').includes(`${SOLO_CONECTADOS_COOKIE}=1`))
  }, [])

  const alternarSoloConectados = () =>
    setSoloConectados((prev) => {
      document.cookie = `${SOLO_CONECTADOS_COOKIE}=${prev ? '0' : '1'}; path=/; max-age=${SOLO_CONECTADOS_MAX_AGE}`
      return !prev
    })

  const visibles = soloConectados ? estudiantes.filter((e) => e.conectado) : estudiantes

  return (
    <div className="relative flex flex-col h-full">
      <DebugPanel classNames={{ button: 'absolute ' }} data={estudiantes} title="Estudiantes en sala" />

      <CabeceraSala />

      {/* Lista de participantes */}
      <div className={cn('flex flex-col flex-1 overflow-hidden mt-4')}>
        <div className={cn('flex-1 max-h-screen overflow-y-auto')}>
          {visibles.length === 0 && (
            <>
              <p className="text-slate-400 italic mt-6 text-center">
                {soloConectados && estudiantes.length > 0
                  ? 'No hay estudiantes conectados en este momento'
                  : 'Ningún estudiante conectado aún...'}
              </p>
              {!soloConectados && (
                <p className="text-slate-400 italic px-6 mt-2 text-center">
                  ¡Compartí el link de la sala con tus estudiantes para que participen de las actividades!
                </p>
              )}
            </>
          )}

          {visibles.length > 0 && (
            <ul className="flex flex-col gap-2 p-2 rounded-xl">
              {visibles.map((e) => (
                <ItemEstudiante key={e.userId} estudiante={e} modo={modo} />
              ))}
            </ul>
          )}
        </div>

        <AccionesPlanilla visibles={visibles} soloConectados={soloConectados} onAlternar={alternarSoloConectados} />
      </div>
    </div>
  )
}

export { ListaMobile } from './lista-mobile'
