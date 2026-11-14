import { cn } from '@/lib/utils'
import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'
import { ListaInvitadosForm, ListaPermitidosForm, type EntradaLista } from './lista-invitados-form'

const AVISO: Record<Exclude<AccesoSala, AccesoSala.Libre>, string> = {
  [AccesoSala.Invitados]:
    'Quienes figuran en esta lista se anotan como invitadxs al ingresar, y la planilla muestra quién faltó.',
  [AccesoSala.Lista]:
    'Solo quienes figuran en esta lista pueden ingresar. Si quitás a alguien que está conectado, sale de la sala.',
}

/** Editor de la lista de una sala `invitados` o `lista`: formulario de alta, la lista cargada y el aviso de qué hace. */
export function SeccionLista({
  metodo,
  acceso,
  lista,
  nombres,
  onAgregar,
  onRemover,
  onBorrar,
}: {
  metodo: MetodosLogin
  acceso: Exclude<AccesoSala, AccesoSala.Libre>
  lista: string[]
  nombres: Record<string, string>
  onAgregar: (entradas: EntradaLista[]) => void
  onRemover: (entrada: string) => void
  onBorrar: () => void
}) {
  return (
    <div className={cn('flex border rounded flex-col items-center gap-2 mt-2')}>
      <h1 className={cn('font-bold mt-2')}>{acceso === AccesoSala.Lista ? 'Lista de acceso' : 'Lista de invitadxs'}</h1>
      <p className={cn('text-xs text-muted-foreground text-center px-4')}>{AVISO[acceso]}</p>
      <div className={cn('flex flex-col gap-2 sm:flex-row w-full p-2')}>
        <ListaInvitadosForm metodo={metodo} onAgregar={(entrada) => onAgregar([entrada])} />
        <ListaPermitidosForm
          metodo={metodo}
          lista={lista}
          nombres={nombres}
          onRemover={onRemover}
          onBorrar={onBorrar}
          onAgregarCSV={onAgregar}
        />
      </div>
    </div>
  )
}
