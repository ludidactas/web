import { useRef, useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const parsear = (texto: string) =>
  texto
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

//formulario agregar invitados

export function ListaInvitadosForm({ onAgregar }: { onAgregar: (dni: string, nombre?: string) => void }) {
  const [inputNombre, setInputNombre] = useState('')
  const [inputDni, setInputDni] = useState('')

  const handleAgregar = () => {
    const dniTrimmed = inputDni.trim()
    if (!dniTrimmed) return
    onAgregar(dniTrimmed, inputNombre.trim() || undefined)
    setInputNombre('')
    setInputDni('')
  }

  return (
    <div className={cn('flex flex-col gap-1 flex-1 rounded p-2 max-h-56')}>
      <p className={cn('text-sm')}>Nombre</p>
      <input
        className={cn('border rounded p-2 text-sm w-full')}
        placeholder="Ingresar Nombre"
        value={inputNombre}
        onChange={(e) => setInputNombre(e.target.value)}
      />
      <p className={cn('text-sm')}>
        DNI <span className={cn('text-red-500 text-xs align-top')}>*</span>
      </p>
      <input
        className={cn('border rounded p-2 text-sm w-full')}
        placeholder="Ingresar DNI"
        value={inputDni}
        inputMode="numeric"
        onChange={(e) => setInputDni(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
      />
      <div className={cn('flex gap-2 mt-1 justify-center')}>
        <button
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-colors',
            inputDni.trim()
              ? 'bg-teal-500 text-white hover:bg-teal-600 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          onClick={handleAgregar}
          disabled={!inputDni.trim()}
        >
          Agregar
        </button>
      </div>
    </div>
  )
}

// lista de permitidos

export function ListaPermitidosForm({
  lista,
  nombres,
  onRemover,
  onBorrar,
  onAgregarCSV,
}: {
  lista: string[]
  nombres: Record<string, string>
  onRemover: (dni: string) => void
  onBorrar: () => void
  onAgregarCSV: (nuevos: string[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onAgregarCSV(parsear(ev.target?.result as string))
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={cn('flex flex-col rounded items-center max-h-50')}>
      <div className={cn('flex m-2 overflow-y-auto bg-slate-50 h-40 w-60 rounded')}>
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
                    >
                      <Icon icon="streamline:delete-1-solid" />
                    </button>
                  </li>
                  <Separator />
                </div>
              ))}
          </ul>
        ) : (
          <p className={cn('text-sm text-muted-foreground/50 italic p-2')}>No has agregado ningún invitado aún</p>
        )}
      </div>
      <div className={cn('flex gap-2 my-2')}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className={cn('hidden')} onChange={handleCSV} />
        <button
          className={cn('px-3 py-1 text-sm border rounded-full bg-indigo-500 text-white hover:bg-indigo-400')}
          onClick={() => fileRef.current?.click()}
          title="Importa una lista de excel en formato CSV"
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
