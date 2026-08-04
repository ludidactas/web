'use client'

import { Check, Copy, Settings } from 'lucide-react'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import useClipboard from '@/components/hooks/use-clipboard'
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

import { DialogAcciones } from './acciones'
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
          <Tabs defaultValue="formulario">
            <TabsList className="rounded-none w-full bg-ld-violeta text-white">
              <TabsTrigger className="text-xs " value="formulario">
                ¡Hacé una pregunta!
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="preguntas">
                Preguntas
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="participantes">
                Participantes
              </TabsTrigger>
            </TabsList>
            <TabsContent value={'formulario'}>
              {/* Vista Formulario - Hacé una pregunta */}
              <div className="flex flex-col bg-white p-2" tabIndex={0}>
                <h1 className="text-3xl text-center p-2 text-ld-violeta">¡Hacé una pregunta!</h1>
                <div className="bg-white h-full rounded-b-xl">
                  {estado === StatusDeConexion.Conectado && (
                    <div className="flex flex-col gap-10">
                      <AgregarPregunta />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preguntas">
              <div className="flex flex-col bg-white">
                <div className="flex flex-col items-center justify-center p-4 h-24">
                  <h1 className="text-3xl text-center text-ld-azul">Lista de Preguntas</h1>
                  <DialogAcciones />
                  <ImportarExportar />
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
        {/* Preguntas Formulario */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl px-2" tabIndex={0}>
          <div className="flex flex-col items-center justify-center p-4 h-24 rounded-t-xl">
            <h1 className="text-3xl md:text-4xl text-center text-ld-violeta">¡Hacé una pregunta!</h1>
          </div>
          <div className="bg-white h-full rounded-b-xl">
            {estado === StatusDeConexion.Conectado && (
              <div className="flex flex-col gap-10">
                <AgregarPregunta />
              </div>
            )}
          </div>
        </div>

        {/* Lista de preguntas */}
        {estado === StatusDeConexion.Conectado && (
          <div className="flex-1 min-w-0 flex flex-col bg-white gap-6 rounded-xl w-[33%] box-content">
            <div className="flex flex-col items-center p-6 h-24 rounded-t-xl">
              <h1 className="text-4xl text-center text-ld-azul">Preguntas</h1>
              <DialogAcciones />
              <ImportarExportar />
            </div>
            <ListaEncuestas />
          </div>
        )}

        {/* Lista de estudiantes y overlay desktop */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Lista de estudiantes */}
          <div className="max-h-[60%]">
            <div className="flex h-full flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes />
            </div>
          </div>

          {/* Overlay */}
          <div className="relative max-h-[40%] flex-col rounded-xl text-ld-violeta-oscuro items-center bg-white">
            {!encuestaEnfocada && (
              <p className="flex items-center justify-center h-full min-h-48 text-slate-400 italic ">
                No hay ninguna encuesta enfocada aún ...{' '}
              </p>
            )}

            {encuestaEnfocada && (
              <>
                <LdSvg className="absolute -top-1 right-0 w-32 h-32 z-10" SvgComponent={enfocar} />
                <div className="w-full border-4 border-ld-violeta-oscuro animate-border-pulse  h-full rounded-xl overflow-y-auto p-10">
                  <p className="flex bg-[#e1e2fb] font-bold text-[23px] py-1 pr-20 pl-12 rounded-xl">
                    Visualizador vista previa
                  </p>
                  <div className="flex flex-col items-center p-2 mt-2 w-full">
                    <div className="flex flex-col items-center gap-2">
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
