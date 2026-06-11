'use client'

import { Copy, QrCode, School, SquareCheckBig } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import useClipboard from '@/components/hooks/use-clipboard'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import ManualQr from '@/components/ui/QR'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { EncuestaSVG } from '@/components/salas/overlay/estadistica-svg'
import { EstadisticaSvgConfig } from '@/components/salas/overlay/estadistica-svg-config'
import LoadingSala from '../loading-sala'

import { DialogAcciones } from './acciones'
import { AgregarPregunta } from './agregar-pregunta'
import { ListaEncuestas } from './lista-encuestas'
import { ListaEstudiantes } from './lista-estudiantes'
import { Status } from './status'

import { cn } from '@/lib/utils'
import { LdSvg } from '@/components/custom/ld-svg'
import enfocar from '@/svg/dist/ui/enfocar.svg'
import { StatusDeConexion, statusesDeCarga } from '@/wss-cli/conexion-wss'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'

export default function EncuestasProfe() {
  const { estado, WssDebugPanel, error } = useConexionProfe()
  const { items: encuestas } = storeEncuestasProfe()
  const { config: configSala } = storeConfig()

  const encuestaEnfocada = encuestas.find((e) => e.isFocused) || encuestas[0]

  // Configuracion del overlay
  const config: EstadisticaSvgConfig = {
    bg: 'rgba(0, 0, 0, 0.6)',
    barHeight: 60,
    barSpacing: 80,
    titleHeight: 70,
    margin: 10,
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

  if (estado === StatusDeConexion.Expirado)
    return <LoadingSala overlay mensaje="Error al conectar con el servidor de salas!" error />

  const linkOverlay = configSala.link.replace(/\/$/, '') + '/overlay'

  return (
    <>
      {process.env.NODE_ENV === 'development' && <WssDebugPanel />}

      <Status />

      {/* VISTA MOBILE */}
      <div className="md:hidden animate-aparecer h-fit flex flex-col">
        {/* Menú de Navegación Mobile */}
        {estado === StatusDeConexion.Conectado && (
          <Tabs defaultValue="formulario">
            <TabsList className="rounded-none w-full bg-[#8345FE] text-white">
              <TabsTrigger className="text-xs " value="formulario">
                ¡Haz una pregunta!
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="preguntas">
                Preguntas
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="participantes">
                Participantes
              </TabsTrigger>
            </TabsList>
            <TabsContent value={'formulario'}>
              {/* Vista Formulario - Haz una pregunta */}
              <div className="flex flex-col bg-white p-2" tabIndex={0}>
                <h1 className="text-3xl text-center p-2 text-[#8345FE]">¡Haz una pregunta!</h1>
                <div className="bg-white h-full rounded-b-xl">
                  {configSala.link && (
                    <div className={cn("flex flex-col items-start gap-2 mb-8 px-2")}>
                      <p className={cn("flex items-center gap-1.5 text-base font-semibold text-slate-800")}>
                        <School size={18} /> Tu sala
                      </p>
                      <p className={cn("text-xs text-slate-500")}>
                        ¡Compartí el link de la sala con tus estudiantes para que participen de las encuestas!
                      </p>
                      <div className={cn("flex gap-2 w-full justify-center pt-1")}>
                        <button
                          className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50")}
                          onClick={() => { navigator.clipboard.writeText(configSala.link); toast.success('¡link copiado!') }}
                        >
                          <Copy size={14} /> Copiar link
                        </button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50")}>
                              <QrCode size={14} /> Mostrar QR
                            </button>
                          </DialogTrigger>
                          <DialogContent className={cn("flex flex-col items-center gap-2 w-fit p-2")} aria-description="QR de tu sala">
                            <DialogHeader>
                              <DialogTitle className="sr-only">QR de tu sala</DialogTitle>
                            </DialogHeader>
                            <ManualQr url={configSala.link} />
                            <DialogFooter>
                              <DialogClose>
                                <p className={cn("px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full")}>Cerrar</p>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}

                  {!configSala.link && <p className="text-center p-4 text-rose-500">Link de sala no recibido</p>}

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
                  <h1 className="text-3xl text-center text-[#00B0D2]">Lista de Preguntas</h1>
                  <DialogAcciones />
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
      <div className="hidden md:flex animate-aparecer py-2 gap-2">
        {/* Preguntas Formulario */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl px-2" tabIndex={0}>
          <div className="flex flex-col items-center justify-center p-4 h-24 rounded-t-xl">
            <h1 className="text-3xl md:text-4xl text-center text-[#8345FE]">¡Haz una pregunta!</h1>
          </div>
          <div className="bg-white h-full rounded-b-xl">
            {configSala.link && (
              <div className={cn("flex flex-col items-start gap-2 mb-8 px-4")}>
                <p className={cn("flex items-center gap-1.5 text-base font-semibold text-slate-800")}>
                  <School size={18} /> Tu sala
                </p>
                <p className={cn("text-xs text-slate-500")}>
                  Compartí el link de la sala con tus estudiantes para que participen de las encuestas
                </p>
                <div className={cn("flex gap-2 w-full justify-center pt-1")}>
                  <button
                    className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50")}
                    onClick={() => { navigator.clipboard.writeText(configSala.link); toast.success('¡link copiado!') }}
                  >
                    <Copy size={14} /> Copiar link
                  </button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50")}>
                        <QrCode size={14} /> Mostrar QR
                      </button>
                    </DialogTrigger>
                    <DialogContent className={cn("flex flex-col items-center gap-2 w-fit p-2")} aria-description="QR de tu sala">
                      <DialogHeader>
                        <DialogTitle className="sr-only">QR de tu sala</DialogTitle>
                      </DialogHeader>
                      <ManualQr url={configSala.link} />
                      <DialogFooter>
                        <DialogClose>
                          <p className={cn("px-4 py-2 text-white text-xl border-2 bg-teal-500 rounded-full")}>Cerrar</p>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {!configSala.link && <p className="text-center p-4 text-rose-500">Link de sala no recibido</p>}

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
              <h1 className="text-4xl text-center text-[#00B0D2]">Preguntas</h1>
              <DialogAcciones />
            </div>
            <ListaEncuestas />
          </div>
        )}

        {/* Lista de estudiantes y overlay desktop */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Lista de estudiantes */}
          <div className="h-[70%]">
            <div className="flex h-full flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes />
            </div>
          </div>

          {/* Overlay */}
          <div className="relative flex-col rounded-xl text-[#6F41CB] items-center bg-white h-[50%]">
            {!encuestaEnfocada && (
              <p className="flex items-center justify-center h-full text-xl ">No hay encuestas enfocadas </p>
            )}

            {encuestaEnfocada && (
              <>
                <LdSvg className="absolute -top-1 right-0 w-32 h-32 z-10" SvgComponent={enfocar} />
                <div className="w-full border-4 border-[#6F41CB] animate-border-pulse  h-full rounded-xl overflow-y-auto">
                  <p className="absolute flex bg-[#e1e2fb] font-bold text-[23px] py-1 m-10 pr-20 pl-12 rounded-xl">
                    Visualizador vista previa
                  </p>
                  <div className="flex flex-col items-center p-2 mt-24 w-full">
                    <div className="flex flex-col items-center">
                      <div className="flex">
                        <Link target="_blank" href={linkOverlay} className="text-blue-700 hover:underline">
                          {linkOverlay}
                        </Link>
                        <button title="Copiar" onClick={handleCopy(linkOverlay)}>
                          {justCopied ? (
                            <SquareCheckBig className="text-emerald-700 w-4 h-4" />
                          ) : (
                            <Copy size={20} className="hover:cursor-pointer" />
                          )}
                        </button>
                      </div>
                    </div>
                    <EncuestaSVG encuesta={encuestaEnfocada} config={config} />
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
