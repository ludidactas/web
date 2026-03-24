import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Encuesta } from '@/wss/tipos'
import { Icon } from '@iconify/react'
import { Info } from 'lucide-react'
import { ComponentProps } from 'react'

import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'

export function Acciones({ encuesta }: { encuesta: Encuesta }) {
  const { revelar, ocultar, enfocar, publicar, esconder, abrir, cerrar, borrar } = useConexionProfe()

  return (
    <div className="flex flex-col my-4 gap-2">
      {/* Primera fila de botones */}
      <div className="flex gap-4 items-center justify-center">
        {/* Revelar y desrevelar votos */}
        {!encuesta.isRevealed && (
          <BotonEncuesta
            className="m-0 md:px-0 bg-cyan-100 text-cyan-600 border-cyan-500 py-2"
            onClick={() => revelar(encuesta.id)}
            texto="Revelar votos"
            icon=""
            title="Los estudiantes no pueden ver los votos. Haz click para revelarlos"
          />
        )}

        {encuesta.isRevealed && (
          <BotonEncuesta
            className="m-0 bg-cyan-500 text-white py-2"
            onClick={() => ocultar(encuesta.id)}
            texto="Ocultar votos"
            icon=""
            title="Los estudiantes pueden ver los votos. Haz click para esconderlos"
          />
        )}

        {/* Enfocar */}
        {!encuesta.isFocused && (
          <BotonEncuesta
            className="bg-purple-500 text-white px-4 py-2 disabled:bg-slate-100 disabled:border-slate-500 disabled:text-slate-500"
            onClick={() => enfocar(encuesta.id)}
            disabled={!encuesta.isPublished}
            texto="Enfocar"
            icon="material-symbols:center-focus-weak-rounded"
          />
        )}

        {/* Publicar/esconder */}
        {!encuesta.isPublished && (
          <BotonEncuesta
            className="bg-emerald-500 text-white p-2"
            onClick={() => publicar(encuesta.id)}
            texto="Publicar"
            icon="mdi:show"
          />
        )}
        {encuesta.isPublished && (
          <BotonEncuesta
            className="bg-emerald-100 text-emerald-600 p-2 border-emerald-500"
            onClick={() => esconder(encuesta.id)}
            texto="Esconder"
            icon="mdi:hide"
          />
        )}
      </div>

      {/* Segunda fila de boones  */}
      <div className="flex gap-4 items-center justify-center">
        {/* Abrir/Cerrar */}
        {!encuesta.isOpen && (
          <BotonEncuesta
            className="bg-indigo-500/90 text-white px-2 md:px-4 py-2"
            onClick={() => abrir(encuesta.id)}
            texto="Abrir"
            icon="mdi:hand-open"
          />
        )}
        {encuesta.isOpen && (
          <BotonEncuesta
            className="bg-indigo-100 px-2 md:px-4 py-2 text-indigo-500 border-indigo-500"
            onClick={() => cerrar(encuesta.id)}
            texto="Cerrar"
            icon="mdi:hand-back-left"
          />
        )}

        {/* Eliminar */}
        <Dialog>
          <DialogTrigger>
            <p className="bg-rose-700 text-white px-4 py-2 rounded-xl flex flex-col items-center gap-1 w-20 text-xs md:text-xl md:min-w-40 border'">
              Eliminar
            </p>
          </DialogTrigger>
          <DialogContent className="flex flex-col items-center">
            <DialogHeader>
              <DialogTitle className="text-center leading-6">
                ¿Estás seguro/a de que deseas eliminar la pregunta?
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <DialogClose>
                <p className="bg-emerald-700/90 text-white px-4 py-2 min-w-40 text-xl rounded-full">Cancelar</p>
              </DialogClose>
              <BotonEncuesta
                className="bg-rose-700 text-white px-4 py-2 rounded-full"
                texto="Eliminar"
                icon="mdi:trash-can"
                onClick={() => borrar(encuesta.id)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export const BotonEncuesta = ({
  children,
  className,
  texto,
  icon,
  ...props
}: ComponentProps<'button'> & { texto: string; icon: string }) => (
  <button
    className={cn(
      'flex flex-col items-center gap-1 w-20 text-xs md:text-xl md:min-w-40 rounded-xl border-2 border-white',
      className
    )}
    {...props}
  >
    <span className="hidden md:block">{texto}</span>
    <span className="md:hidden w-full flex justify-center">
      <Icon icon={icon} />
    </span>
    {children}
  </button>
)

export function DialogAcciones() {
  return (
    <div className="flex rounded text-[#00B0D2] items-center justify-center hover:font-bold hover:underline">
      <Dialog>
        <DialogTrigger className="flex gap-1 ">
          <Info />
          <p>Ver info sobre acciones</p>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Acciones de encuesta</DialogTitle>
            <DialogDescription className="text-center">
              Te explicamos las acciones que podés realizar en cada encuesta mediante los botones
            </DialogDescription>
          </DialogHeader>
          <p className="font-bold">Revelar/Desrevelar votos:</p>
          <span>
            Por defecto, los participantes, incluído el <span className="text-cyan-500">overlay</span>, no pueden ver
            las respuestas en sus salas. Para que puedan verlos, activá la opcion{' '}
            <span className="text-cyan-500">revelar votos</span>{' '}
          </span>
          <p className="font-bold">Enfocar:</p>
          <ol className="list-disc px-4">
            <li>Se activa para visualizar la pregunta y las respuestas en vivo en el overlay.</li>
            <li>Solo cuando una pregunta está publicada, puede ser enfocada</li>
            <li>El link para visualizar el overlay se encuentra junto con el link de la sala en la parte superior</li>
          </ol>
          <p className="font-bold">Publicar/Esconder:</p>
          <p>
            Cuando se crea una pregunta, esta no se publica en la sala de estudiantes inmediatamente. Para hacerla
            visible se debe hacer click en <span className="text-cyan-500">publicar</span>
          </p>
          <p className="font-bold">Abrir/Cerrar:</p>
          <ol className="list-disc px-4">
            <li>
              Todas las preguntas creadas, tienen el estado <span className="text-emerald-500">abierto</span> y admite
              votos
            </li>
            <li>
              Al cerrar la pregunta, los participantes seguirán viendo la pregunta publicada, pero no podrán emitir
              votos
            </li>
          </ol>
          <p className="font-bold">Eliminar</p>
          <p>
            <span className="text-rose-400 font-bold">Elimina definitivamente</span> la pregunta! Antes podés copiarla a
            texto junto con sus preguntas con el ícono de copiar en el margen superior derecho. Luego pegala en
            cualquier lugar donde puedas pegar texto.
          </p>

          <DialogClose className="flex justify-center">
            <Icon className="w-10 h-10" icon={'lets-icons:close-ring'} />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
