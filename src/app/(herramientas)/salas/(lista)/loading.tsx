import HeaderSala from '@/components/salas/header-sala'
import { cn } from '@/lib/utils'

/** Lo que se ve mientras carga la lista de salas: el mismo shell que la página, con "Cargando..." en su lugar. */
export default function LoadingListaSalas() {
  return (
    <div className="h-screen flex flex-col overflow-y-auto sm:overflow-hidden bg-ld-gradiente-fondo">
      <HeaderSala waveHeight="h-[20px] md:h-[50px]" />
      <p className={cn('p-4 text-muted-foreground')}>Cargando...</p>
    </div>
  )
}
