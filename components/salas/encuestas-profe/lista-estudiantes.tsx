import useClipboard from '@/components/hooks/use-clipboard'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import getInitials, { getRandomColor } from '@/lib/avatarname'
import { cn, exportarPlanilla } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@radix-ui/react-hover-card'
import { Copy, Download, Eraser, SquareCheckBig, Users, X, Settings } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'
import { useEncuestaProfe } from './encuestas-profe-context'
import PanelConfigSala from './panel-config-sala'

export const ListaEstudiantes = () => {
  const { estudiantes, limpiarEstudiantesSala } = useEncuestaProfe()

  const { handleCopy, justCopied } = useClipboard()

  const handleExportToExcel = () => {
    // Prepara los datos para Excel
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
    <div className="flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center rounded-xl gap-2 mb-4">
        <h1 className="flex gap-2 md:gap-4 text-xl md:text-2xl sm:w-[250px] font-bold text-[#6F41CB]">
          <Users className='w-8 h-8' />
          Participantes
        </h1>

        {/* Botones para limpiar y copiar  */}
        <div className="flex gap-1 ">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className="flex text-center w-fit rounded-full bg-[#6F41CB] p-2 text-white font-bold hover:scale-110"
                onClick={limpiarEstudiantesSala}
              >
                <Eraser size={20} />
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              {' '}
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Limpiar lista</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className="items-center w-fit rounded-full bg-[#6F41CB] p-2 text-white hover:scale-110"
                onClick={handleCopy(datosEstudiantes)}
              >
                {justCopied ? <SquareCheckBig size={20} /> : <Copy size={20} />}
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              {' '}
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Copiar lista</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className="items-center w-fit rounded-full bg-[#6F41CB] p-2 text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExportToExcel}
                disabled={estudiantes.length === 0}
              >
                <Download size={20} />
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Exportar a Excel</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <PanelConfigSala>
              <HoverCardTrigger asChild>
                <button className="items-center w-fit rounded-full bg-[#6F41CB] p-2 text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Settings size={20} />
                </button>
              </HoverCardTrigger>
            </PanelConfigSala>
            <HoverCardContent>
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500">Configuración</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {estudiantes.length === 0 && (
          <p className="text-slate-400 italic mt-6 text-center">Ningún estudiante conectado aún...</p>
        )}

        {estudiantes.length > 0 && (
          <ul className="flex flex-col gap-2 p-2 rounded-xl">
            {estudiantes.map((e) => (
              <li
                key={e.userId}
                className={cn({
                  'text-black flex gap-2 ': e.conectado,
                  'text-slate-400 flex gap-2 grayscale': !e.conectado,
                })}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 mt-1 p-2 rounded-full flex items-center justify-center text-white font-semibold bg-center bg-cover`}
                  style={{
                    backgroundImage: `url(${e.avatar})`,
                    backgroundColor: getRandomColor(e.nombre || 'Anonimo'),
                  }}
                >
                  {/* {e.icono && <Iconito icon={e.icono as IconosDisponibles}/>} */}
                  {!e.avatar && getInitials(e.nombre || 'Anonimo')}
                </div>
                {/* Nombre, email y DNI */}
                <div className="flex flex-col">
                  <span>{e.nombre}</span>
                  {!e.es_anonimo && <span className="text-teal-500">{e.userId}</span>}
                  {e.es_anonimo && <span className="text-slate-400 italic">Anónimo</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
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
