'use client'

import { Check, Copy, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import useClipboard from '@/components/hooks/use-clipboard'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EncuestaSVG } from '@/components/salas/overlay/estadistica-svg'
import {
  CONFIG_DEFAULTS,
  construirUrlOverlay,
  EstadisticaSvgConfig,
} from '@/components/salas/overlay/estadistica-svg-config'
import LoadingSala from '../loading-sala'
import { PanelConfigOverlay } from './panel-config-overlay'
import { AgregarPregunta } from './agregar-pregunta'
import { ImportarExportar } from './importar-exportar'
import { ListaEncuestas } from './lista-encuestas'
import { ListaEstudiantes } from './lista-estudiantes'
import { Status } from './status'
import { LdSvg } from '@/components/custom/ld-svg'
import enfocar from '@/svg/dist/ui/enfocar.svg'
import { StatusDeConexion, statusesDeCarga } from '@/wss-cli/conexion-wss'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'
import { Icon } from '@iconify/react/dist/iconify.js'

export default function EncuestasProfe() {
  const { estado, WssDebugPanel, error, actualizarConfig } = useConexionProfe()
  const { items: encuestas } = storeEncuestasProfe()
  const { config: configSala } = storeConfig()

  const encuestaEnfocada = encuestas.find((e) => e.isFocused)

  // Config del overlay editable desde el panel. Es solo la preferencia del profe: siembra el panel y
  // es el source del link. El overlay real solo lee query params, no esta config.
  const [config, setConfig] = useState<EstadisticaSvgConfig>(CONFIG_DEFAULTS)

  // Sembramos una vez con la config guardada de la sala cuando llega (sin pisar ediciones posteriores).
  const configSembrada = useRef(false)
  const overlayGuardado = configSala?.overlay
  useEffect(() => {
    if (!configSembrada.current && overlayGuardado) {
      setConfig(overlayGuardado)
      configSembrada.current = true
    }
  }, [overlayGuardado])

  // Al cerrar el panel persistimos la config como preferencia de la sala; solo si cambió algo.
  const guardarConfig = () => {
    if (JSON.stringify(config) === JSON.stringify(overlayGuardado)) return
    actualizarConfig({ overlay: config })
    toast.success('Configuración del visualizador guardada')
  }

  const { handleCopy, justCopied } = useClipboard()

  if (statusesDeCarga.includes(estado)) {
    return <LoadingSala overlay mensaje="Conectando..." />
  }

  if (estado === StatusDeConexion.Error) {
    return <LoadingSala overlay mensaje={error ?? undefined} error />
  }

  if (!configSala) {
    return <LoadingSala overlay mensaje="Esperando config de sala..." />
  }

  const linkOverlay = construirUrlOverlay(configSala.link.replace(/\/$/, '') + '/overlay', config)

  return (
    <>
      <WssDebugPanel />
      <Status />

      {/* VISTA MOBILE */}
      <div className="md:hidden animate-aparecer h-fit flex flex-col">
        {/* Menú de Navegación Mobile */}
        {estado === StatusDeConexion.Conectado && (
          <Tabs defaultValue="preguntas">
            <TabsList className="rounded-none w-full bg-ld-violeta text-white">
              <TabsTrigger className="text-xs" value="preguntas">
                Preguntas
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="participantes">
                Participantes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preguntas">
              <div className="flex flex-col bg-white">
                <div className="flex flex-col items-center justify-center p-4">
                  <h1 className="flex gap-2 text-3xl font-medium text-center text-ld-azul">
                    Preguntas
                    <Icon icon={'fluent:chat-bubbles-question-16-regular'} />
                  </h1>
                  <div className="flex flex-col gap-2 py-4">
                    <AgregarPregunta />
                    <ImportarExportar />
                    <BorrarTodo />
                  </div>
                </div>
                <ListaEncuestas />
              </div>
            </TabsContent>

            <TabsContent value="participantes">
              <div className="flex flex-col bg-white">
                <div className="p-4 min-h-screen">
                  <ListaEstudiantes />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* VISTA DESKTOP */}
      <div className="hidden md:flex animate-aparecer py-2 gap-2 max-h-screen mb-2">
        {/* Lista de preguntas */}
        {estado === StatusDeConexion.Conectado && (
          <div className="flex-1 min-w-0 flex flex-col h-90 bg-white gap-2 rounded-xl w-[33%] box-content">
            <div className="flex items-center p-6 justify-between rounded-t-xl">
              <div className="flex flex-col px-10 gap-3">
                <h1 className="flex gap-2 text-5xl font-medium text-center text-ld-azul">
                  Preguntas
                  <Icon icon={'fluent:chat-bubbles-question-16-regular'} />
                </h1>
              </div>
              <div className="flex flex-col gap-2">
                {/* Boton agregar pregunta */}
                <AgregarPregunta />
                <ImportarExportar />
                <BorrarTodo />
              </div>
            </div>
            <ListaEncuestas />
          </div>
        )}

        {/* Lista de estudiantes y overlay desktop */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Lista de estudiantes */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes />
            </div>
          </div>

          {/* Overlay */}
          <div className="relative flex-1 min-h-0 max-h-[40%] flex flex-col overflow-hidden rounded-xl text-ld-violeta-oscuro items-center bg-white">
            {!encuestaEnfocada && (
              <p className="flex items-center justify-center h-full min-h-48 text-slate-400 italic ">
                No hay ninguna encuesta enfocada aún ...{' '}
              </p>
            )}

            {encuestaEnfocada && (
              <>
                <LdSvg className="absolute -top-1 right-0 w-32 h-32 z-10" SvgComponent={enfocar} />
                <div className="w-full border-4 border-ld-violeta-oscuro animate-border-pulse  h-full rounded-xl overflow-y-auto p-10">
                  <p className="text-ld-violeta text-center text-2xl">Visualizador</p>
                  <div className="flex flex-col items-center p-2 mt-2 w-full">
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all active:scale-95',
                                justCopied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'hover:bg-slate-50'
                              )}
                              onClick={handleCopy(linkOverlay)}
                            >
                              {justCopied ? <Check size={14} /> : <Copy size={14} />}
                              {justCopied ? '¡Copiado!' : 'Copiar link'}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Copiá el link del visualizador</p>
                          </TooltipContent>
                        </Tooltip>
                        <Popover onOpenChange={(open) => !open && guardarConfig()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <button
                                  className={cn(
                                    'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 active:scale-95 transition-transform'
                                  )}
                                >
                                  <Settings size={14} /> Configurar
                                </button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Configurá la apariencia del visualizador</p>
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent align="end" className="max-h-[70vh] w-80 overflow-y-auto">
                            <PanelConfigOverlay config={config} onChange={setConfig} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <EncuestaSVG encuesta={encuestaEnfocada} config={config} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/** Botón con confirmación para eliminar todas las preguntas de la sala. */
function BorrarTodo() {
  const { borrar } = useConexionProfe()
  const { items: encuestas } = storeEncuestasProfe()

  const borrarTodo = () => {
    const cantidad = encuestas.length
    encuestas.forEach((encuesta) => borrar(encuesta.id))
    toast.success(`${cantidad} pregunta${cantidad === 1 ? '' : 's'} eliminada${cantidad === 1 ? '' : 's'}`)
  }

  return (
    <Dialog>
      <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
        <DialogTrigger asChild>
          <button
            className="group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-rose-500 hover:bg-rose-500/80 transition-colors disabled:text-slate-500 disabled:bg-slate-100 disabled:no-underline disabled:font-normal md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base"
            disabled={encuestas.length === 0}
            title="Eliminar todas las preguntas de esta sala"
          >
            <Icon icon="mdi:trash-can" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
              Borrar todo
            </span>
          </button>
        </DialogTrigger>
      </div>
      <DialogContent className="flex flex-col items-center">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">
            ¿Eliminar las {encuestas.length} pregunta(s) de la sala?
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-slate-500">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <DialogClose asChild>
            <button className="bg-emerald-700/90 text-white px-4 py-2 min-w-40 text-xl rounded-full">Cancelar</button>
          </DialogClose>
          <DialogClose asChild>
            <button
              className="flex items-center gap-1 bg-rose-700 text-white px-4 py-2 rounded-full"
              onClick={borrarTodo}
            >
              <Icon icon="mdi:trash-can" /> Borrar todo
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
