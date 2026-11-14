import { useRef, useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MetodosLogin } from '@/wss/validators/auth'
import { IDENTIDAD_EN_LISTA } from '../opciones-sala'
import { entradaValida, parsearCSV, type EntradaLista } from './csv-lista'

export type { EntradaLista }

/** Formulario para agregar una entrada (identidad + nombre opcional) a la lista de la sala. */
export function ListaInvitadosForm({
  metodo,
  onAgregar,
}: {
  metodo: MetodosLogin
  onAgregar: (entrada: EntradaLista) => void
}) {
  const textos = IDENTIDAD_EN_LISTA[metodo]
  const [inputNombre, setInputNombre] = useState('')
  const [inputIdentidad, setInputIdentidad] = useState('')

  const identidad = entradaValida(metodo, inputIdentidad)
  const hayTexto = inputIdentidad.trim() !== ''

  const handleAgregar = () => {
    if (identidad === null) return
    onAgregar({ identidad, nombre: inputNombre.trim() || undefined })
    setInputNombre('')
    setInputIdentidad('')
  }

  return (
    <div className={cn('flex flex-col gap-1 flex-1 rounded max-h-56')}>
      <p className={cn('text-sm')}>
        {textos.etiqueta} <span className={cn('text-red-500 text-xs align-top')}>*</span>
      </p>
      <input
        className={cn('border rounded p-2 text-sm w-full', hayTexto && identidad === null && 'border-red-400')}
        placeholder={textos.placeholder}
        value={inputIdentidad}
        inputMode={textos.inputMode}
        onChange={(e) =>
          setInputIdentidad(metodo === MetodosLogin.DNI ? e.target.value.replace(/\D/g, '') : e.target.value)
        }
        onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
        aria-invalid={hayTexto && identidad === null}
      />
      <p className={cn('text-sm')}>{textos.etiquetaNombre}</p>
      <input
        className={cn('border rounded p-2 text-sm w-full')}
        placeholder="Opcional"
        value={inputNombre}
        onChange={(e) => setInputNombre(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
      />
      <div className={cn('flex gap-2 mt-1 justify-center')}>
        <button
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-colors',
            identidad !== null
              ? 'bg-teal-500 text-white hover:bg-teal-600 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          onClick={handleAgregar}
          disabled={identidad === null}
        >
          Agregar
        </button>
      </div>
    </div>
  )
}

/** La lista cargada, con alta por CSV, baja por entrada y borrado total. */
export function ListaPermitidosForm({
  metodo,
  lista,
  nombres,
  onRemover,
  onBorrar,
  onAgregarCSV,
}: {
  metodo: MetodosLogin
  lista: string[]
  nombres: Record<string, string>
  onRemover: (entrada: string) => void
  onBorrar: () => void
  onAgregarCSV: (nuevos: EntradaLista[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const textos = IDENTIDAD_EN_LISTA[metodo]

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const { entradas, descartadas } = parsearCSV(ev.target?.result as string, metodo)
      if (descartadas.length > 0)
        toast.warning(
          `${descartadas.length} fila(s) sin ${textos.etiqueta.toLowerCase()} válido se descartaron: ${descartadas
            .slice(0, 3)
            .join(', ')}${descartadas.length > 3 ? '…' : ''}`
        )
      if (entradas.length > 0) onAgregarCSV(entradas)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={cn('flex flex-col rounded items-center max-h-50 flex-1')}>
      <div className={cn('flex m-2 overflow-y-auto bg-slate-50 h-40 w-full rounded')}>
        {lista.length > 0 ? (
          <ul className={cn('text-sm flex flex-col w-full p-2')}>
            {[...lista]
              .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
              .map((item) => (
                <div key={item}>
                  <li className={cn('flex items-center justify-between gap-2 w-full py-1')}>
                    <p className={cn('flex flex-col')}>
                      <span>{nombres[item]}</span>
                      <span>{item}</span>
                    </p>
                    <button
                      className={cn('text-xs text-red-400 hover:text-red-600 shrink-0')}
                      onClick={() => onRemover(item)}
                      aria-label={`Quitar ${item}`}
                    >
                      <Icon icon="streamline:delete-1-solid" />
                    </button>
                  </li>
                  <Separator />
                </div>
              ))}
          </ul>
        ) : (
          <p className={cn('text-sm text-muted-foreground/50 italic p-2')}>No has agregado ninguna entrada aún</p>
        )}
      </div>
      <div className={cn('flex gap-2 my-2')}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className={cn('hidden')} onChange={handleCSV} />
        <button
          className={cn('px-3 py-1 text-sm border rounded-full bg-indigo-500 text-white hover:bg-indigo-400')}
          onClick={() => fileRef.current?.click()}
          title={`Importa una lista de excel en formato CSV, con una columna "${textos.etiqueta}" y otra opcional con el nombre`}
        >
          Importar CSV
        </button>
        <button
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-colors',
            lista.length > 0
              ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          onClick={onBorrar}
          disabled={lista.length === 0}
        >
          Borrar lista
        </button>
      </div>
    </div>
  )
}
