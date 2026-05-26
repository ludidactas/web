import { PropsWithChildren, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Separator } from "@/components/ui/separator"
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import { SwitchCard } from '@/components/ui/switch-card'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storePermitidos } from '@/wss-cli/stores/permitidos-store'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { Icon } from '@iconify/react/dist/iconify.js'
import { cn } from '@/lib/utils'

export default function PanelConfigSala({ children }: PropsWithChildren) {
  const { actualizarConfig} = useConexionProfe()
  const { config } = storeConfig()
  const { lista: listaPermitidos} = storePermitidos()
  const [listaActiva, setListaActiva] = useState(listaPermitidos.length > 0 || !!config?.solo_invitados)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col items-center" aria-description="Configuración de la sala">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">Configuración de la sala</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 w-full">
          <SwitchCard
            title="DNI obligatorio"
            description="Los participantes tienen que ingresar DNI para participar"
            checked={config?.pedir_dni}
            onCheckedChange={() => actualizarConfig({ pedir_dni: !config?.pedir_dni })}
          />

          {/* Wrapeando el dialog con AnimatePresence y motion.div para que colapse suavemente */}
          <AnimatePresence initial={false}>
            {config?.pedir_dni && (
              <motion.div
                key="lista-invitados-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden', width: '100%' }}
                className="flex flex-col gap-2"
              >
                <SwitchCard
                  title="Lista de Invitadxs"
                  description="Podés cargar tu propia lista de invitadxs"
                  checked={listaActiva}
                  onCheckedChange={() => setListaActiva((v) => !v)}
                />

                <AnimatePresence initial={false}>
                  {listaActiva && (
                    <motion.div
                      key="lista-detalle"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden', width: '100%' }}
                      className="flex flex-col gap-2 pt-2"
                    >
                      <SwitchCard
                        title="Permitir ingreso sólo a invitadxs"
                        description="Sólo quienes están en tu lista de invitadxs pueden ingresar a la sala"
                        checked={config?.solo_invitados}
                        onCheckedChange={() => actualizarConfig({ solo_invitados: !config?.solo_invitados })}
                      />

                      {/* Lista */}
                      <div className="flex border rounded flex-col items-center gap-2 max-h-72 mt-2">
                        <h1 className='font-bold my-2'>Lista de Invitadxs</h1>
                        <div className="flex w-full">
                          {/* Ingresar invitadx */}
                          <ListaInvitados />
                          {/* Lista de permitidxs */}
                          <ListaPermitidos/>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
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

const ListaInvitados = () => {
  const { setNombre: guardarNombre } = storePermitidos()
  const { agregarPermitidos } = useConexionProfe()
  const [inputNombre, setInputNombre] = useState('')
  const [inputDni, setInputDni] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const handleAgregar = () => {
    const dniTrimmed = inputDni.trim()
    if (!dniTrimmed) return
    agregarPermitidos([dniTrimmed])
    const nombreTrimmed = inputNombre.trim()
    if (nombreTrimmed) guardarNombre(dniTrimmed, nombreTrimmed)
    setInputNombre('')
    setInputDni('')
  }

  const parsear = (texto: string) =>
    texto.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)

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
    <div className="flex flex-col gap-1 flex-1 rounded p-2 max-h-56">
      <p className="text-sm">Nombre</p>
      <input
        className="border rounded p-2 text-sm w-full"
        placeholder="Ingresar Nombre"
        value={inputNombre}
        onChange={(e) => setInputNombre(e.target.value)}
      />
      <p className="text-sm">DNI <span className='text-red-500 text-xs align-top'>*</span></p>
      <input
        className="border rounded p-2 text-sm w-full"
        placeholder="Ingresar DNI"
        value={inputDni}
        inputMode="numeric"
        onChange={(e) => setInputDni(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
      />
      <div className="flex gap-2 mt-1 justify-center">
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
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSV} />
      </div>
    </div>
  )
}

const ListaPermitidos = () => {
  const { removerPermitidos, borrarListaPermitidos, agregarPermitidos } = useConexionProfe()
  const { lista: listaPermitidos, nombres} = storePermitidos()
  const fileRef = useRef<HTMLInputElement>(null)

  const parsear = (texto: string) =>
    texto.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)

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

  return (<div className='flex flex-col rounded items-center max-h-50'>
    <div className="flex m-2 overflow-y-auto bg-slate-50 h-40 w-60 rounded">
      {listaPermitidos.length > 0 ? (
        <ul className="text-sm flex flex-col w-full p-2">
          {[...listaPermitidos]
            .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
            .map((item) => (
              <div key={item}>
                <li className="flex items-center justify-between gap-2 w-full py-1">
                  <p className='flex flex-col'>
                    <span>{`${nombres[item]}`}</span>
                    <span>{`${item}`}</span>
                  </p>
                  <button
                    className="text-xs text-red-400 hover:text-red-600 shrink-0"
                    onClick={() => removerPermitidos([item])}
                  >
                    <Icon icon={'streamline:delete-1-solid'} />
                  </button>
                </li>
                <Separator />
              </div>
            ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic p-2">No has agregado ningún invitado aún</p>
      )}
    </div>
    <div className='flex gap-2 my-2'>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSV} />
      <button
        className="px-3 py-1 text-sm border rounded-full bg-indigo-500 text-white hover:bg-indigo-400"
        onClick={() => fileRef.current?.click()}
        title='Importa una lista de excel en formato CSV'
      >
        Importar CSV
      </button>
      <button
        className={cn(
          'px-3 py-1 text-sm rounded-full transition-colors',
          listaPermitidos.length > 0
            ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
        onClick={borrarListaPermitidos}
        disabled={listaPermitidos.length === 0}
      >
        Borrar lista
      </button>
    </div>
  </div>)
}