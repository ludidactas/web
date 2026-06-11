import { Check, CircleCheckBig, Copy, Download, Eraser, ListCollapse, QrCode, School, Settings, SquareCheckBig, Users, X } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'
import { isEmpty } from 'remeda'
import { QRCodeSVG } from 'qrcode.react'

import getInitials, { getRandomColor } from '@/lib/avatarname'
import { cn, exportarPlanilla } from '@/lib/utils'

import PanelConfigSala from './panel-config-sala'

import DebugPanel from '@/components/ui/debug-panel'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@radix-ui/react-hover-card'

import useClipboard from '@/components/hooks/use-clipboard'

import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'
import { storeEstudiantes } from '@/wss-cli/stores/estudiantes-store'
import { storeConfig } from '@/wss-cli/stores/config-store'

export const ListaEstudiantes = () => {
  const { limpiarEstudiantes } = useConexionProfe()
  const { items: estudiantes } = storeEstudiantes()
  const { config: configSala } = storeConfig()
  const [linkCopiado, setLinkCopiado] = useState(false)

  const { handleCopy, justCopied } = useClipboard()

  const handleExportToExcel = () => {
    const datosParaExcel = estudiantes.map((e) => ({
      Nombre: e.nombre || 'Sin nombre',
      Email: e.email || 'Sin email',
      DNI: e.dni || 'Sin DNI',
    }))

    exportarPlanilla(datosParaExcel)
  }

  const datosEstudiantes = estudiantes
    .map((e) => (e.email ? `${e.nombre} (${e.email})` : `${e.nombre} (${e.dni})`))
    .join('\n')

  return (
    <div className="relative flex flex-col h-full">
      <DebugPanel classNames={{ button: 'absolute ' }} data={estudiantes} title="Estudiantes en sala" />

      <Tabs defaultValue="participantes" className="flex flex-col h-full">
        {/* Header: tabs + settings gear */}
        <div className={cn("flex items-center gap-2 mb-3")}>
          <TabsList className={cn("flex-1 h-fit bg-slate-100")}>
            <TabsTrigger value="tu-sala" className={cn("flex-1 flex items-center gap-2 text-lg font-semibold py-2.5 data-[state=active]:text-[#6F41CB]")}>
              <School size={18} /> Tu sala
            </TabsTrigger>
            <TabsTrigger value="participantes" className={cn("flex-1 flex items-center gap-2 text-lg font-semibold py-2.5 data-[state=active]:text-[#00B0D2]")}>
              <Users size={18} /> Participantes
            </TabsTrigger>
          </TabsList>
          <HoverCard>
            <PanelConfigSala>
              <HoverCardTrigger asChild>
                <button className={cn("items-center w-fit rounded-full bg-[#6F41CB] p-2 text-white hover:scale-110")}>
                  <Settings size={16} />
                </button>
              </HoverCardTrigger>
            </PanelConfigSala>
            <HoverCardContent>
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Configuración</p>
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Tab: Tu sala */}
        <TabsContent value="tu-sala" className={cn("flex flex-col gap-4 pt-2")}>
          <p className={cn("text-xs text-slate-500")}>
            ¡Compartí el link de la sala con tus estudiantes para que participen de las encuestas!
          </p>
          {configSala?.link ? (
            <div className={cn("flex gap-2 w-full justify-center")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all active:scale-95",
                      linkCopiado ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "hover:bg-slate-50"
                    )}
                    onClick={() => {
                      navigator.clipboard.writeText(configSala.link)
                      setLinkCopiado(true)
                      setTimeout(() => setLinkCopiado(false), 2000)
                    }}
                  >
                    {linkCopiado ? <Check size={14} /> : <Copy size={14} />}
                    {linkCopiado ? '¡Copiado!' : 'Copiar link'}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Copiá el link para compartirlo con tus estudiantes</p>
                </TooltipContent>
              </Tooltip>
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <button className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 active:scale-95 transition-transform")}>
                        <QrCode size={14} /> Mostrar QR
                      </button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Mostrá el código QR para que tus estudiantes se unan escaneándolo</p>
                  </TooltipContent>
                </Tooltip>
                <DialogContent className={cn("flex flex-col items-center gap-2 w-fit p-2")} aria-description="QR de tu sala">
                  <DialogHeader>
                    <DialogTitle className="sr-only">QR de tu sala</DialogTitle>
                  </DialogHeader>
                  <QRCodeSVG value={configSala.link} size={256} />
                  <DialogFooter>
                    <DialogClose>
                      <p className={cn("px-3 py-1 text-white text-sm border-2 bg-teal-500 rounded-full")}>Cerrar</p>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className={cn("text-center text-rose-500 text-sm")}>Link de sala no recibido</p>
          )}
        </TabsContent>

        {/* Tab: Participantes */}
        <TabsContent value="participantes" className={cn("flex flex-col flex-1 overflow-hidden")}>
          <div className={cn("flex-1 overflow-y-auto")}>
        {estudiantes.length === 0 && (
          <p className="text-slate-400 italic mt-6 text-center">Ningún estudiante conectado aún...</p>
        )}
      
        {estudiantes.length > 0 && (
          <ul className="flex flex-col gap-2 p-2 rounded-xl">
            {estudiantes.map((e) => (
              <li
                key={e.userId}
                className={cn('flex items-center gap-2', {
                  'text-black ': e.conectado,
                  'text-slate-400 grayscale': !e.conectado,
                })}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 shrink-0 mt-1 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-center bg-cover"
                  style={{
                    backgroundImage: e.avatar ? `url(${e.avatar})` : undefined,
                    backgroundColor: getRandomColor(e.nombre || 'Anonimo'),
                  }}
                >
                  {!e.avatar && getInitials(e.nombre || 'Anonimo')}
                </div>
                {/* Nombre, email y DNI */}
                <div className="flex flex-col">
                  <span>{e.nombre}</span>
                  {!e.es_anonimo && <span className="text-teal-500">{e.userId}</span>}
                  {e.es_anonimo && <span className="text-slate-400 italic">Anónimo</span>}
                </div>

                <TooltipVotosEstudiante userId={e.userId}>
                  <ListCollapse className="ml-auto cursor-pointer text-gray-500 hover:text-cyan-500" />
                </TooltipVotosEstudiante>
              </li>
            ))}
          </ul>
        )}
        </div>
                  <div className={cn("flex justify-end gap-1 mb-3")}>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  className={cn("flex text-center w-fit rounded-full bg-[#6F41CB] p-2 text-white font-bold hover:scale-110")}
                  onClick={limpiarEstudiantes}
                >
                  <Eraser size={16} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Limpiar lista</p>
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  className={cn("items-center w-fit rounded-full bg-[#6F41CB] p-2 text-white hover:scale-110")}
                  onClick={handleCopy(datosEstudiantes)}
                >
                  {justCopied ? <SquareCheckBig size={16} /> : <Copy size={16} />}
                </button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Copiar lista</p>
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  className={cn("items-center w-fit rounded-full bg-[#6F41CB] p-2 text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed")}
                  onClick={handleExportToExcel}
                  disabled={estudiantes.length === 0}
                >
                  <Download size={16} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Exportar a Excel</p>
              </HoverCardContent>
            </HoverCard>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  )
}

export const ListaMobile = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  return (
    <div className="block lg:hidden self-center">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <h1 className="flex gap-2 text-md font-bold bg-indigo-50 p-4 mb-2 rounded-xl text-indigo-500">
            <Users className="w-30 self-center" />
            Lista de Participantes
          </h1>
        </DialogTrigger>
        <DialogContent className="overflow-y-auto rounded-xl">
          <DialogTitle />
          {children}
          <DialogClose className="justify-items-center">
            <X size={40} className="bg-indigo-500 text-white  rounded-full p-2" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TooltipVotosEstudiante({ children, userId }: PropsWithChildren & { userId: string }) {
  const [open, setOpen] = useState(false)

  const { pedirVotosEstudiante } = useConexionProfe()
  const { items: estudiantes } = storeEstudiantes()
  const { items: encuestas } = storeEncuestasProfe()

  const estudiante = estudiantes.find((e) => e.userId === userId)

  if (!estudiante) return children

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger onClick={() => setOpen(true)} onMouseEnter={() => pedirVotosEstudiante(userId)} asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent asChild>
        <div className="text-sm rounded-md flex flex-col gap-2 max-h-[40vh] max-w-md overflow-y-auto pl-2 pr-4">
          {!estudiante.votos && 'Cargando...'}
          {estudiante.votos && isEmpty(estudiante.votos) && 'No votó todavía'}
          {estudiante.votos &&
            Object.entries(estudiante.votos).map(([idEncuesta, idsOpciones]) => {
              // Buscamos la encuesta por id en el storage para renderizar el nombre
              const encuesta = encuestas.find((e) => e.id === idEncuesta)

              if (!encuesta) return <div className="text-gray-500">Encuesta {idEncuesta} no encontrada</div>

              const textoPregunta =
                encuesta.pregunta.length > 120 ? encuesta.pregunta.slice(0, 120) + '...' : encuesta.pregunta

              return (
                <div key={idEncuesta} className="hover:bg-[#d9f3f8] py-1 px-2 rounded">
                  <strong>{textoPregunta}</strong>
                  <div>
                    {idsOpciones.map((idOpcion, i) => {
                      // Buscamos la opción por id en la encuesta para renderizar el texto
                      const opcion = encuesta.opciones.find((o) => o.id === idOpcion)

                      if (!opcion)
                        return (
                          <p key={i} className="text-gray-500">
                            Opción {idOpcion} no encontrada
                          </p>
                        )

                      const textoOpcion = opcion.texto.length > 120 ? opcion.texto.slice(0, 120) + '...' : opcion.texto

                      return (
                        <p key={i} className="pl-1 flex gap-0.5 items-center text-xs">
                          {encuesta.admiteMultiplesVotos && <SquareCheckBig className="w-3 h-3 shrink-0" />}
                          {!encuesta.admiteMultiplesVotos && <CircleCheckBig className="w-3 h-3 shrink-0" />}
                          {textoOpcion}
                        </p>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
