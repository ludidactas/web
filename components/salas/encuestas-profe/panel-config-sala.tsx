import { PropsWithChildren, useRef, useState } from 'react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SwitchCard } from '@/components/ui/switch-card'

import { storeConfig } from '@/wss-cli/stores/config-store'
import { storePermitidos } from '@/wss-cli/stores/permitidos-store'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'

export default function PanelConfigSala({ children }: PropsWithChildren) {
  const { actualizarConfig, agregarPermitidos, removerPermitidos, borrarListaPermitidos } = useConexionProfe()
  const { config } = storeConfig()
  const { lista: listaPermitidos } = storePermitidos()

  const [input, setInput] = useState('')
  const [listaVisible, setListaVisible] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const parsear = (texto: string) =>
    texto.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)

  const handleCargar = () => {
    const lista = parsear(input)
    agregarPermitidos(lista)
    setInput('')
  }

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lista = parsear(ev.target?.result as string)
      agregarPermitidos(lista)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col items-center" aria-description="Configuración de la sala">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">Configuración de la sala</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <SwitchCard
            title="DNI obligatorio"
            description="Los participantes tienen que ingresar DNI para participar"
            checked={config?.pedir_dni}
            onCheckedChange={() => actualizarConfig({ pedir_dni: !config?.pedir_dni })}
          />

          {config?.pedir_dni && (
            <div className="flex flex-col gap-2 pt-2">
              <button
                className="text-sm font-medium text-left flex items-center gap-1"
                onClick={() => setListaVisible((v) => !v)}
              >
                Lista de permitidos
                <span className="text-xs text-muted-foreground">({listaPermitidos.length})</span>
                <span className="text-xs">{listaVisible ? '▲' : '▼'}</span>
              </button>

              {listaVisible && (
                <div className="flex gap-3 items-stretch">
                  <div className="flex flex-col gap-2 flex-1">
                    <textarea
                      className="border rounded p-2 text-sm w-full"
                      placeholder="Un DNI por renglón o separados por coma"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={5}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          input.trim()
                            ? 'bg-teal-500 text-white hover:bg-teal-600 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        onClick={input.trim() ? handleCargar : undefined}
                        disabled={!input.trim()}
                      >
                        Cargar lista
                      </button>
                      <button
                        className="px-3 py-1 text-sm border rounded-full hover:bg-muted"
                        onClick={() => fileRef.current?.click()}
                      >
                        Importar CSV
                      </button>
                      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSV} />
                      <button
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          listaPermitidos.length > 0
                            ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        onClick={listaPermitidos.length > 0 ? borrarListaPermitidos : undefined}
                        disabled={listaPermitidos.length === 0}
                      >
                        Borrar lista
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 border rounded overflow-y-auto">
                    {listaPermitidos.length > 0 ? (
                      <ul className="text-sm text-muted-foreground flex flex-col divide-y">
                        {[...listaPermitidos]
                          .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
                          .map((dni) => (
                            <li key={dni} className="flex items-center justify-between gap-2 px-2 py-1">
                              <span>{dni}</span>
                              <button
                                className="text-xs text-red-400 hover:text-red-600 shrink-0"
                                onClick={() => removerPermitidos([dni])}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">Sin lista — todos los DNI son válidos</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose>
            <p className="px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full">Cerrar</p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}