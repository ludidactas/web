'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import EncuestasIcon from '@/svg/encuestas.svg'
import { Encuesta } from '@/wss/tipos'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Copy,
  SquareCheckBig,
  Users,
  X,
  Eraser,
  Send,
  CirclePlus,
  MessageCircleQuestionIcon,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, PropsWithChildren, useState } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'
import { useEncuestaProfe } from './encuestas-profe-context'
import { ScrollBar } from '@/components/ui/scroll-area'
import { cn, exportarPlanilla } from '@/lib/utils'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import getInitials, { getRandomColor } from '@/lib/avatarname'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'
import { toast } from 'sonner'
import { DialogTrigger, Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@radix-ui/react-hover-card'
import { Icon } from '@iconify/react'

export default function EncuestasAdmin() {
  const { linkSala, estado } = useEncuestaProfe()
  const [_copiedText, copy] = useCopyToClipboard()
  const [justCopied, setJustCopied] = useState(false)

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        setJustCopied(true)

        setTimeout(() => {
          setJustCopied(false)
        }, 3000)
      })
      .catch((error) => {
        console.error('Failed to copy!', error)
      })
  }

  return (
    <>
      {/* DEBUG */}
      {/* <pre>{JSON.stringify({ ready, storedSession }, null, 2)}</pre>
      <pre>{JSON.stringify({ estado, error }, null, 2)}</pre> */}

      <div className="flex gap-2 justify-center">
        <div className="rounded-xl flex w-auto">
          <div className="w-[25em] md:w-[45em] bg-white p-6 md:p-10 rounded-xl">
            {/* Lista de Participantes Mobile */}
            <div className="block lg:hidden justify-self-end">
              <ListaMobile>
                <ListaEstudiantes />
              </ListaMobile>
            </div>

            <Status />

            {linkSala && (
              <div className="flex items-center justify-center gap-4 my-10">
                <p className="leading-normal text-center text-xs md:text-lg">
                  Tu sala:{' '}
                  <Link href={linkSala} className="text-blue-700 hover:underline">
                    {linkSala}
                  </Link>
                </p>
                <button title="Copiar" onClick={handleCopy(linkSala)}>
                  {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
                </button>
              </div>
            )}

            {!linkSala && <span>Link de sala no recibido</span>}

            {/* Barra de status */}

            <hr className="invisible py-2" />

            {estado === StatusDeConexion.Conectado && (
              <div className="flex flex-col gap-10">
                <AgregarPregunta />
                <ListaEncuestas />
              </div>
            )}

            {estado !== StatusDeConexion.Conectado && (
              <div className="text-center">
                <p className="text-xl m-4">¡Ups! No se puede conectar con el servidor</p>
                <p>
                  Actualizá la página, o envianos un mensaje :{' '}
                  <span className="text-cyan-500">ludidactas.adm@gmail.com</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-0 flex flex-col gap-4 bg-white rounded-xl h-max p-8">
            <ListaEstudiantes />
          </div>
        </div>
      </div>
    </>
  )
}

const ListaEstudiantes = () => {
  const { estudiantes, limpiarEstudiantesSala } = useEncuestaProfe()
  const [_copiedText, copy] = useCopyToClipboard()
  const [justCopied, setJustCopied] = useState(false)

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        setJustCopied(true)

        console.log(_copiedText)

        setTimeout(() => {
          setJustCopied(false)
        }, 3000)
      })
      .catch((error) => {
        console.error('Failed to copy!', error)
      })
  }

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
    <>
      <div className="flex justify-between bg-indigo-50 p-4 mb-2 rounded-xl">
        <h1 className="flex gap-4 text-2xl sm:w-[250px] font-bold text-indigo-500">
          <Users size={30} />
          Participantes
        </h1>

        {/* Botones para limpiar y copiar  */}
        <div className="flex gap-1">
          <HoverCard>
            <HoverCardTrigger>
              <span
                className="flex text-center w-fit rounded-full bg-indigo-500/90 p-2 text-white font-bold hover:scale-110"
                onClick={limpiarEstudiantesSala}
              >
                <Eraser size={20} />
              </span>
            </HoverCardTrigger>
            <HoverCardContent>
              {' '}
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500/50">Limpiar lista</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger>
              <button
                className="items-center w-fit rounded-full bg-indigo-500/90 p-2 text-white hover:scale-110"
                onClick={handleCopy(datosEstudiantes)}
              >
                {justCopied ? <SquareCheckBig size={20} /> : <Copy size={20} />}
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              {' '}
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500/50">Copiar lista</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger>
              <button
                className="items-center w-fit rounded-full bg-indigo-500/90 p-2 text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExportToExcel}
                disabled={estudiantes.length === 0}
              >
                <Download size={20} />
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-xs text-white rounded-xl p-2 mt-1 bg-slate-500/50">Exportar a Excel</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      {estudiantes.length === 0 && <p className="text-slate-400 italic">Ningún estudiante conectado aún...</p>}

      {estudiantes.length > 0 && (
        <ul className="flex flex-col gap-2 p-2 rounded-xl">
          {estudiantes.map((e) => (
            <li
              key={e.sessionId}
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
                {/* <span className="text-teal-500">{e.email ?? `Anónimo`}</span> */}
                {e.dni && <span className="text-teal-500">{e.dni}</span>}
                {!e.dni && e.email && <span className="text-teal-500">{e.email}</span>}
                {!e.dni && !e.email && <span className="text-slate-400 italic">Anónimo</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const ListaMobile = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <h1 className="flex gap-2 text-xl md:text-2xl font-bold bg-indigo-50 p-4 mb-2 rounded-xl text-indigo-500">
          <Users className="w-30 self-center" />
          Participantes
        </h1>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogTitle />
        {children}
        <DialogClose className="justify-items-center">
          <X size={40} className="bg-indigo-500 text-white  rounded-full p-2" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function Status() {
  const { estado } = useEncuestaProfe()
  return (
    <div className="relative flex items-center justify-between pr-4 mb-4">
      <div className="absolute md:inset-y-4 rounded-xl bg-indigo-50 w-full h-14 md:h-24" />

      <div className="flex relative items-center justify-between">
        <LdSvg className="w-20 md:w-40" SvgComponent={EncuestasIcon} />
        <h1 className="text-xl md:text-5xl font-bold text-indigo-500">Encuestas</h1>
      </div>

      {estado === StatusDeConexion.Conectado ? (
        <span className="text-emerald-700 animate-pulse">Conectado</span>
      ) : (
        <span className="text-red-700">Desconectado</span>
      )}
    </div>
  )
}

function ListaEncuestas() {
  const { encuestas } = useEncuestaProfe()
  if (encuestas.length == 0) return <></>

  return (
    <ScrollArea className="max-h-screen overflow-x-auto">
      {encuestas.map((e) => (
        <DisplayEncuesta key={e.id} encuesta={e} />
      ))}

      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { cerrarPregunta, borrarPregunta, abrirPregunta, publicarPregunta, esconderPregunta, enfocarPregunta, revelarOpciones, desrevelarOpciones } =
    useEncuestaProfe()
  const [_copiedText, copy] = useCopyToClipboard()
  const [justCopied, setJustCopied] = useState(false)

  const opcionesInfo = encuesta.opciones.map((opcion) => '\n' + opcion.texto + ' -' + ' ' + opcion.votos + ' votos')

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        setJustCopied(true)

        setTimeout(() => {
          setJustCopied(false)
        }, 3000)
      })
      .catch((error) => {
        console.error('Failed to copy!', error)
      })
  }

  const estado = encuesta.isFocused ? 'Enfocada' : (
    encuesta.isOpen ? 'Abierta' : 'Cerrada'
  )

  return (
    <div className="p-4 m-4 rounded-xl border-4 border-indigo-50">
      {/* Titulo y status */}
      <div className="flex gap-4 bg-white rounded-xl p-4 items-start justify-between">
        <div className="flex gap-4 md:p-4 items-center">
          <MessageCircleQuestionIcon size={40} className="self-start text-indigo-500" />
          {/* <LdSvg className='w-[10%]' SvgComponent={PollsIcon} /> */}
          <h3 className="w-[90%] text-sm break-all md:text-xl">{encuesta.pregunta}</h3>
        </div>
        <div className="flex flex-col w-20 md:gap-1 items-end">
          <span
            className={cn('text-sm', {
              'text-emerald-700 animate-pulse duration-1000': estado === 'Abierta',
              'text-rose-800': estado === 'Cerrada',
              'text-violet-700 font-bold animate-pulse duration-500': estado === 'Enfocada',
            })}
          >
            {estado}
          </span>
          <span className="text-[0.6rem] whitespace-nowrap text-slate-400 text-right">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>
          <button
            className="mt-2"
            title="Copiar pregunta"
            onClick={handleCopy(encuesta.pregunta + '\n' + opcionesInfo)}
          >
            {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
          </button>
        </div>
      </div>

      <ol className="list-[lower-latin] text-xs md:text-xl text-slate-400 py-8 pl-8 md:px-12 content-center m-2 md:m-6">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            <div className="flex border-b-2 border-dashed justify-between pt-2 gap-4">
              <p className="break-all">{opcion.texto}</p>
              <p className="text-emerald-500 font-bold w-40 text-right content-center"> {opcion.votos} votos </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Acciones */}
      <div className="flex items-center justify-center gap-4 my-2">
        {/* Enfocar */}
        {!encuesta.isFocused && (
          <BotonEncuesta
            className="bg-violet-600 text-white px-4 py-2 rounded disabled:bg-violet-300"
            onClick={() => enfocarPregunta(encuesta.id)}
            disabled={!encuesta.isPublished}
            texto="Enfocar"
            icon="material-symbols:center-focus-weak-rounded"
          />
        )}

        {/* Revelar/desrevelar */}
        {!encuesta.isRevealed && (
          <BotonEncuesta
            className="bg-yellow-500 text-white px-4 py-2 rounded"
            onClick={() => revelarOpciones(encuesta.id)}
            texto="Revelar"
            icon="mdi:text-box-outline"
          />
        )}
        {encuesta.isRevealed && (
          <BotonEncuesta
            className="bg-yellow-100 text-black px-2 md:px-4 py-2 rounded border border-yellow-900"
            onClick={() => desrevelarOpciones(encuesta.id)}
            texto="Desrevelar"
            icon="mdi:question-mark"
          />
        )}

        {/* Publicar/esconder */}
        {!encuesta.isPublished && (
          <BotonEncuesta
            className="bg-emerald-500 text-white px-4 py-2 rounded"
            onClick={() => publicarPregunta(encuesta.id)}
            texto="Publicar"
            icon="mdi:show"
          />
        )}
        {encuesta.isPublished && (
          <BotonEncuesta
            className="bg-emerald-100 text-black px-2 md:px-4 py-2 rounded border border-green-900"
            onClick={() => esconderPregunta(encuesta.id)}
            texto="Esconder"
            icon="mdi:hide"
          />
        )}

        {/* Abrir/Cerrar */}
        {!encuesta.isOpen && (
          <BotonEncuesta
            className="bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
            onClick={() => abrirPregunta(encuesta.id)}
            texto="Abrir"
            icon="mdi:hand-open"
          />
        )}
        {encuesta.isOpen && (
          <BotonEncuesta
            className="bg-indigo-100 text-black px-2 md:px-4 py-2 rounded border border-blue-900"
            onClick={() => cerrarPregunta(encuesta.id)}
            texto="Cerrar"
            icon="mdi:hand-back-left"
          />
        )}

        {/* Eliminar */}
        <BotonEncuesta
          className="bg-rose-800/90 text-white px-4 py-2 rounded"
          onClick={() => borrarPregunta(encuesta.id)}
          texto="Eliminar"
          icon="mdi:trash-can"
        />
      </div>
    </div>
  )
}

const BotonEncuesta = ({
  children,
  className,
  texto,
  icon,
  ...props
}: ComponentProps<'button'> & { texto: string; icon: string }) => (
  <button className={cn('w-20 text-xs md:text-xl md:w-32 px-2 md:px-4 py-2 rounded border', className)} {...props}>
    <span className="hidden md:block">{ texto }</span>
    <span className="md:hidden w-full flex justify-center">
      <Icon icon={ icon } />
    </span>
    {children}
  </button>
)

function AgregarPregunta() {
  const { enviarPregunta } = useEncuestaProfe()

  const [pregunta, setPregunta] = useState('')
  const [respuestas, setRespuestas] = useState<string[]>(['', ''])

  const agregarRespuesta = () => {
    setRespuestas((rs) => [...rs, ''])
  }

  const actualizarRespuesta = (index: number, valor: string) => {
    setRespuestas((respuestas) => {
      const nuevas = [...respuestas]
      nuevas[index] = valor
      return nuevas
    })
  }

  const eliminarRespuesta = (index: number) => {
    if (respuestas.length > 1) {
      setRespuestas((respuestas) => respuestas.filter((_, i) => i !== index))
    }
  }

  const postearPregunta = () => {
    enviarPregunta(pregunta, respuestas)
      .then(() => {
        toast.success(`Encuesta creada!`)
        setPregunta('')
        setRespuestas(['', ''])
      })
      .catch((msg) => toast.error(msg))
  }

  return (
    <div className="flex flex-col rounded-xl bg-indigo-50 p-4 gap-2">
      <p className="text-xl">Pregunta:</p>
      <textarea
        className="border-b w-full p-2 resize-none"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        tabIndex={1}
      />

      {respuestas.map((respuesta, index) => (
        <div key={index} className="flex gap-4 items-center">
          <span className="whitespace-nowrap">Opc. {index + 1}</span>
          <input
            className="border-b w-full p-1"
            type="text"
            value={respuesta}
            onChange={(e) => actualizarRespuesta(index, e.target.value)}
            tabIndex={index + 2}
          />
          {respuestas.length > 1 && (
            <button
              className="text-rose-600 border border-b-2 border-r-2 hover:border-b-4 hover:border-r-4 border-rose-700 px-2 py-1 rounded text-sm transition-all duration-100 w-8 h-8"
              onClick={() => eliminarRespuesta(index)}
              tabIndex={-1}
            >
              X
            </button>
          )}
        </div>
      ))}

      <button
        className=" flex place-content-center items-center font-semibold gap-2 bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
        onClick={agregarRespuesta}
        tabIndex={respuestas.length + 2}
      >
        <CirclePlus size={20} />
        Agregar opción
      </button>
      <button
        className="flex place-content-center items-center font-semibold gap-2 bg-emerald-500 text-white px-2 md:px-4 py-2 rounded"
        onClick={postearPregunta}
        tabIndex={respuestas.length + 2}
      >
        <Send size={20} /> Enviar pregunta
      </button>
    </div>
  )
}
