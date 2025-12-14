'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollBar } from '@/components/ui/scroll-area'
import getInitials, { getRandomColor } from '@/lib/avatarname'
import { cn, exportarPlanilla } from '@/lib/utils'
import EncuestasIcon from '@/svg/encuestas.svg'
import { Encuesta } from '@/wss/tipos'
import { Icon } from '@iconify/react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@radix-ui/react-hover-card'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CircleDot, CirclePlus, Copy, Download, Eraser, Eye, EyeOff, Info, MessageCircleQuestionIcon, Send, SquareCheckBig, Users, X } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, PropsWithChildren, useState } from 'react'
import { toast } from 'sonner'
import { useCopyToClipboard } from 'usehooks-ts'
import { EncuestaSVG } from '../[idSala]/overlay/components/estadistica-svg'
import { EstadisticaSvgConfig } from '../[idSala]/overlay/components/estadistica-svg-config'
import { useEncuestaProfe } from './encuestas-profe-context'
import profeUps from '@/svg/ProfeUpsSVGO.svg'
import { pollBase } from '@/wss/validators/polls'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'
import Image from 'next/image'
import Dedito from '@/public/img/icons8-one-finger-32.png'

export default function EncuestasProfe() {
  const { linkSala, estado, encuestas, WssDebugPanel } = useEncuestaProfe()
  
  const [_copiedText, copy] = useCopyToClipboard()
  const [justCopied, setJustCopied] = useState(false)
  const encuestaEnfocada = encuestas.find((e) => e.isFocused) || encuestas[0]

  // Configuracion del overlay
  const config: EstadisticaSvgConfig = {
    bg: 'rgba(0, 0, 0, 0.6)', // Cambia el fondo
    barHeight: 60, // Cambia la altura de barras
    barSpacing: 80, // Cambia el espaciado
    titleHeight: 70, // Cambia la altura del título
    margin: 10, //Cambia el margin
  }

  const linkOverlay = linkSala + 'overlay'

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
    <div className="flex flex-col">
      {/* DEBUG */}
      <WssDebugPanel />

      <Status />
      <div className='flex flex-col md:flex-row p-2 md:py-2 md:gap-2 justify-center'>
        
        {/* Preguntas Formulario*/}
        <div className="flex flex-col bg-white rounded-xl pb-2">
          <div className='flex flex-col items-center justify-center p-4 h-24 bg-indigo-500 rounded-t-xl'>
            <h1 className='text-xl md:text-3xl text-center text-white'>¡Haz una pregunta!</h1>
          </div>


          {linkSala && (
            <div className="flex flex-col items-center justify-center gap-1 mb-8">

              {/* Link sala */}
              <div className='flex gap-2 text-xl pt-6'>
                <p className="leading-normal text-center text-sm md:text-lg">
                  Tu sala:{' '}
                  <Link target='_blank' href={linkSala} className="text-blue-700 hover:underline">
                    {linkSala}
                  </Link>
                </p>
                <button title="Copiar" onClick={handleCopy(linkSala)}>
                  {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
                </button>
              </div>


              {/* Lista de Participantes Mobile */}
              <ListaMobile>
                <ListaEstudiantes />
              </ListaMobile>

              {/* Overlay Mobile */}
              {/* <div className='w-full flex flex-col text-indigo-500 font-bold items-center lg:hidden bg-white'>
                    <p>Vista previa </p>
                    <EncuestaSVG encuesta={encuestaEnfocada} config={config} />
                  </div> */}
              {/* </div> */}
            </div>
          )}

          {!linkSala && <p className='text-center p-4 text-rose-500'>Link de sala no recibido</p>}

          {/* Pregunta formulario */}
          {estado === StatusDeConexion.Conectado && (
            <div className="flex flex-col gap-10">
              <AgregarPregunta />

            </div>
          )}

          {estado !== StatusDeConexion.Conectado && (
            <p className="flex flex-col text-center text-xl gap-2 p-4 ">
              <span className='text-3xl pb-2'>¡Ups!</span>
              <span>No se puede conectar con el servidor</span>
              <span>Actualizá la página, o envianos un mensaje a </span>

              <span className="text-cyan-500">ludidactas.adm@gmail.com</span>
            </p>
          )}
        </div>


        {estado === StatusDeConexion.Conectado && (<>
          {/* Lista de Preguntas Mobile */}
          <div className='block mt-2 md:hidden flex-col bg-white gap-6 rounded-xl'>
            <div className='flex flex-col justify-center bg-indigo-500 h-24 rounded-t-xl'>
              <h1 className='text-3xl text-center text-white'>Preguntas</h1>
              {/* Info para el usuario acerca de acciones */}
              <DialogAcciones />
            </div>
            <ListaEncuestas />
          </div>

          {/* Lista de Preguntas Desktop  */}
          <div className="hidden md:flex flex-col bg-white gap-6 rounded-xl">
            {/* Header */}
            <div className='flex flex-col items-center p-4 bg-indigo-500 h-24 rounded-t-xl'>
              <h1 className='text-3xl text-center text-white'>Preguntas</h1>
              {/* Info para el usuario acerca de acciones */}
              <DialogAcciones />
            </div>
            <ListaEncuestas />
          </div></>
        )}


        <div className='flex flex-col gap-4'>
          {/* Lista estudiantes desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-0 flex max-h-60 flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes />
            </div>
          </div>

          {/* Overlay Desktop */}
          <div className='hidden md:flex md:flex-col rounded-xl text-indigo-500 items-center bg-white'>
            {encuestaEnfocada && (
              <div className='flex flex-col p-2 gap-2 items-center'>
                <p className='flex gap-2 font-bold '>Visualizador vista previa
                  <CircleDot absoluteStrokeWidth className='animate-pulse text-emerald-500' />
                </p>
                <div className='flex flex-col'>
                  <p className="text-center text-md">
                    Link:
                  </p>
                  <div className='flex gap-2'>
                    <Link target='_blank' href={linkOverlay} className="text-blue-700 hover:underline">
                      {linkOverlay}
                    </Link>
                    <button title="Copiar" onClick={handleCopy(linkOverlay)}>
                      {justCopied ? <SquareCheckBig className="text-emerald-700 w-4 h-4" /> : <Copy className='w-4 h-4' />}
                    </button>
                  </div>
                </div>
              </div>)}
            <EncuestaSVG encuesta={encuestaEnfocada} config={config} />
          </div>

        </div>
      </div>
    </div>

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
    <div>
      <div className="flex justify-between rounded-xl">
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

      {estudiantes.length === 0 && <p className="text-slate-400 italic p-2">Ningún estudiante conectado aún...</p>}

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
    </div>
  )
}

const ListaMobile = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  return (<div className="block lg:hidden self-center">
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

function Status() {
  const { estado } = useEncuestaProfe()
  return (
    
      <div className='flex flex-col mt-4 mx-1 p-4 bg-white rounded-xl'>
        <div className='flex justify-between items-center mx-2'>
          <div className="flex items-center gap-2">
            <LdSvg className="w-16 md:w-36" SvgComponent={EncuestasIcon} />
            <div className='flex flex-col items-start'>
              <h1 className="text-3xl md:text-5xl font-bold text-indigo-500">Encuestas</h1>
              <p className='hidden md:flex md:text-center md:w-full md:text-xl'>¡Haz preguntas en vivo y compártelas a través del link de la sala!</p>
            </div>
          </div>

          {estado === StatusDeConexion.Conectado ? (
            <span className="text-emerald-500 font-bold animate-pulse text-xs md:text-xl">Conectado</span>
          ) : (
            <span className="text-red-700 text-xs md:text-xl">Desconectado</span>
          )}
        </div>
        <p className='flex md:hidden text-center text-xs p-2'>¡Haz preguntas en vivo y compártelas a través del link de la sala!</p>

      </div>

  )
}

function ListaEncuestas() {
  const { encuestas } = useEncuestaProfe()
  if (encuestas.length == 0) return <div>
    <p className='text-center m-4'> ¡Aún no haz hecho ninguna pregunta!</p>
    <LdSvg className='grayscale' SvgComponent={profeUps} />
  </div>

  return (
    <ScrollArea className="h-[500px] overflow-y-auto" scrollHideDelay={1000}>
      {encuestas.map((e) => (
        <DisplayEncuesta key={e.id} encuesta={e} />
      ))}

      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const {
    cerrarPregunta,
    borrarPregunta,
    abrirPregunta,
    publicarPregunta,
    esconderPregunta,
    enfocarPregunta,
    revelarOpciones,
    desrevelarOpciones,
  } = useEncuestaProfe()
  const [_copiedText, copy] = useCopyToClipboard()
  const [justCopied, setJustCopied] = useState(false)

  const opcionesInfo = encuesta.opciones.map((opcion) => '\n' + opcion.texto + ' -' + ' ' + opcion.votos + ' votos')
  const totalVotos = encuesta.opciones.reduce((total, opcion) => total + opcion.votos, 0)

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

  const estado = encuesta.isFocused ? 'Enfocada' : encuesta.isOpen ? 'Abierta' : 'Cerrada'

  return (
    <div className="p-4 m-4 rounded-xl border-4 border-indigo-500/10">
      {/* Titulo y status */}
      <div className="flex flex-col sm:flex-row md:gap-4 bg-indigo-500/10 text-indigo-500 rounded-xl p-2 md:p-4 justify-between sm:items-center">
        <div className="flex gap-2 items-center">
          <MessageCircleQuestionIcon size={10} className="shrink-0 col-start-1 col-end-2 w-10 h-10" />
          <h3 className="text-sm break-words font-bold  md:text-xl">{encuesta.pregunta}</h3>
        </div>
        <div className="flex flex-col md:gap-1 items-end">
          <span
            className={cn('text-sm', {
              'text-emerald-700 animate-pulse duration-1000': estado === 'Abierta',
              'text-rose-800': estado === 'Cerrada',
              'text-violet-500 font-bold animate-pulse duration-500': estado === 'Enfocada',
            })}
          >
            {estado}
          </span>
          <span className="text-[0.6rem] whitespace-nowrap text-slate-400 text-right">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>

          {/* Botones de arriba a la derecha */}
          <div className='flex items-center justify-end'>
            {/* Lista de opciones y votos */}
            <div className="flex justify-end">
              {encuesta.isRevealed && <Eye absoluteStrokeWidth className="text-cyan-500 mr-6" />}{' '}
              {!encuesta.isRevealed && <EyeOff absoluteStrokeWidth className="mr-6" />}
            </div>
            <button
              className="mt-2"
              title="Copiar pregunta"
              onClick={handleCopy(
                encuesta.pregunta + '\n' + opcionesInfo + '\n' + 'Total participantes: ' + totalVotos
              )}
            >
              {justCopied ? (
                <SquareCheckBig absoluteStrokeWidth className="text-emerald-700" />
              ) : (
                <Copy absoluteStrokeWidth />
              )}
            </button>
          </div>
        </div>
      </div>

      {encuesta.admiteAportes && (
        <p className="text-xs list-none text-center text-emerald-500">Los estudiantes pueden agregar opciones</p>
      )}

      {/* Opciones */}
      <ol className="list-[lower-latin] text-xs md:text-xl font-bold rounded-xl border-4 border-indigo-500/10 text-slate-400 py-4 pl-8 md:px-10 flex flex-col gap-4 m-2 ">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            <div className="flex border-b-2 border-dashed justify-between pt-2 gap-4">
              <p className="w-64">{opcion.texto}</p>
              <div className="w-24 flex items-center justify-end">
                <p className={` font-bold  content-center ${encuesta.isRevealed ? 'text-cyan-500' : 'text-gray-500'}`}>
                  {' '}
                  {opcion.votos}
                </p>
                <Image className="shrink-0" src={Dedito} alt="dedito" />
              </div>
            </div>
          </li>
        ))}
        <ol>
          <li className="flex mt-2 text-md mx-16 text-indigo-500 rounded-xl bg-indigo-500/10 font-bold text-center justify-between p-2 gap-4">
            <p> Total Participantes </p> <p>{totalVotos}</p>{' '}
          </li>
        </ol>
      </ol>

      {/* Acciones */}

      <div className="flex flex-col my-4 gap-2">
        {/* Primera fila de botones */}
        <div className="flex gap-4 items-center justify-center">
          {/* Revelar y desrevelar votos */}
          {!encuesta.isRevealed && (
            <BotonEncuesta
              className="m-0 md:px-0 bg-cyan-100 text-cyan-600 border-2 border-cyan-500 py-2 rounded"
              onClick={() => revelarOpciones(encuesta.id)}
              texto="Revelar votos"
              icon=""
              title="Los estudiantes no pueden ver los votos. Haz click para revelarlos"
            />
          )}

          {encuesta.isRevealed && (
            <BotonEncuesta
              className="m-0 bg-cyan-500 text-white py-2 rounded"
              onClick={() => desrevelarOpciones(encuesta.id)}
              texto="Ocultar votos"
              icon=""
              title="Los estudiantes pueden ver los votos. Haz click para esconderlos"
            />
          )}

          {/* Enfocar */}
          {!encuesta.isFocused && (
            <BotonEncuesta
              className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-purple-100 disabled:border-2 disabled:border-purple-500 disabled:text-purple-500"
              onClick={() => enfocarPregunta(encuesta.id)}
              disabled={!encuesta.isPublished}
              texto="Enfocar"
              icon="material-symbols:center-focus-weak-rounded"
            />
          )}

          {/* Publicar/esconder */}
          {!encuesta.isPublished && (
            <BotonEncuesta
              className="bg-emerald-500 text-white p-2 rounded"
              onClick={() => publicarPregunta(encuesta.id)}
              texto="Publicar"
              icon="mdi:show"
            />
          )}
          {encuesta.isPublished && (
            <BotonEncuesta
              className="bg-emerald-100 text-emerald-600 p-2 rounded border-2 border-emerald-500"
              onClick={() => esconderPregunta(encuesta.id)}
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
              className="bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
              onClick={() => abrirPregunta(encuesta.id)}
              texto="Abrir"
              icon="mdi:hand-open"
            />
          )}
          {encuesta.isOpen && (
            <BotonEncuesta
              className="bg-indigo-100 px-2 md:px-4 py-2 rounded border-2 text-indigo-500 border-indigo-500"
              onClick={() => cerrarPregunta(encuesta.id)}
              texto="Cerrar"
              icon="mdi:hand-back-left"
            />
          )}

          {/* Eliminar */}
          <Dialog>
            <DialogTrigger>
              <p className="bg-rose-700 text-white px-4 py-2 rounded flex flex-col items-center gap-1 w-20 text-xs md:text-xl md:min-w-40 border'">
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
                  <p className="bg-emerald-700/90 text-white px-4 py-2 flex flex-col items-center gap-1 w-20 text-xs md:text-xl md:min-w-40 rounded border">
                    Cancelar
                  </p>
                </DialogClose>
                <BotonEncuesta
                  className="bg-rose-700 text-white px-4 py-2 rounded"
                  texto="Eliminar"
                  icon="mdi:trash-can"
                  onClick={() => borrarPregunta(encuesta.id)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
  <button className={cn('flex flex-col items-center gap-1 w-20 text-xs md:text-xl md:min-w-40 rounded border', className)} {...props}>
    <span className="hidden md:block">{texto}</span>
    <span className="md:hidden w-full flex justify-center">
      <Icon icon={icon} />
    </span>
    {children}
  </button>
)

function AgregarPregunta() {
  const { enviarPregunta } = useEncuestaProfe()

  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState<string[]>(['', ''])
  const [admiteAportes, setAdmiteAportes] = useState<boolean | 'indeterminate'>(false)

  const agregarRespuesta = () => {
    setOpciones((rs) => [...rs, ''])
  }

  const actualizarRespuesta = (index: number, valor: string) => {
    setOpciones((respuestas) => {
      const nuevas = [...respuestas]
      nuevas[index] = valor
      return nuevas
    })
  }

  const eliminarRespuesta = (index: number) => {
    if (opciones.length > 1) {
      setOpciones((respuestas) => respuestas.filter((_, i) => i !== index))
    }
  }

  const { success, error } = pollBase.safeParse({ pregunta, opciones, admiteAportes })

  const postearPregunta = () => {
    enviarPregunta(pregunta, opciones, admiteAportes === 'indeterminate' ? false : admiteAportes)
      .then(() => {
        toast.success(`Encuesta creada!`)
        setPregunta('')
        setOpciones(['', ''])
      })
      .catch((msg) => toast.error(msg))
  }


  return (
    <div className="flex flex-col mx-2 rounded-xl bg-indigo-50 p-4 gap-2">
      <p className="text-xl">Pregunta:</p>
      <textarea
        className="border-b w-full p-2 resize-none"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        tabIndex={1}
      />

      {opciones.map((respuesta, index) => (
        <div key={index} className="flex gap-4 items-center">
          <span className="whitespace-nowrap">Opc. {index + 1}</span>
          <input
            className="border-b w-full p-1"
            type="text"
            value={respuesta}
            onChange={(e) => actualizarRespuesta(index, e.target.value)}
            tabIndex={index + 2}
          />
          {opciones.length > 1 && (
            <button
              className="flex items-center text-rose-600 border border-b-2 border-r-2 hover:border-b-4 hover:border-r-4 border-rose-700 p-1 rounded text-sm transition-all duration-100"
              onClick={() => eliminarRespuesta(index)}
              tabIndex={-1}
            >
              <X size={15} absoluteStrokeWidth />
            </button>
          )}
        </div>

      ))}

      {/* Checkbox estudiantes pueden agregar respuestas */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Checkbox className='bg-white' checked={admiteAportes} onCheckedChange={setAdmiteAportes} title="" />
        <p className="text-indigo-500">Los estudiantes pueden agregar sus propias opciones</p>
      </div>

      {error && (
        <p className="flex text-rose-500 md:w-96 self-center text-center text-xs">(La pregunta debe tener al menos dos opciones o permitir que los estudiantes puedan agregarlas)</p>
      )}

      {/* Boton agregar respuesta */}
      <button
        className=" flex place-content-center items-center font-semibold gap-2 bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
        onClick={agregarRespuesta}
        tabIndex={opciones.length + 2}
      >
        <CirclePlus size={20} />
        Agregar opción
      </button>
      {/* Boton postear pregunta */}

      <button
        disabled={!success}
        className='flex place-content-center items-center font-semibold gap-2 bg-emerald-500 text-white px-2 md:px-4 py-2 rounded disabled:bg-slate-300 disabled:text-slate-500'
        onClick={postearPregunta}
        tabIndex={opciones.length + 2}
      >
        <Send size={20} /> Enviar pregunta
      </button>
    </div>
  )
}

function DialogAcciones() {
  return (
    <div className="flex rounded text-white items-center justify-center hover:font-bold hover:underline">
      <Dialog>
        <DialogTrigger className="flex gap-1 ">
          <Info />
          <p>Ver info sobre acciones</p>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Acciones de encuesta</DialogTitle>
            <DialogDescription className="text-center">
              Te explicamos las acciones que podés realizar en cada encuesta mediante los botones
            </DialogDescription>
          </DialogHeader>
          <p className="font-bold">Revelar/Desrevelar votos:</p>
          <span>
            Por defecto, los participantes, incluído el <span className="text-cyan-500">overlay</span>, no pueden
            ver las respuestas en sus salas. Para que puedan verlos, activá la opcion{' '}
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
            Elimina definitivamente la pregunta <span className="text-rose-500">!</span>. Podés copiarla a texto antes
            con el ícono de copiar en el margen superior derecho.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
