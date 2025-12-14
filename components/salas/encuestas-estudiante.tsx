'use client'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
// import Image from 'next/image'
import { useState } from 'react'
import { useEncuestaEstudiante } from '../../app/(herramientas)/sala/components/encuestas-estudiante-context'
import { LdSvg } from '@/components/custom/ld-svg'
import DibuEstudiante from '/svg/upssvgo.svg'
import Cabeza from '/svg/cabezasvgo.svg'
// import Polls from '/svg/pollsvgo.svg'
import { oscilar } from '@/lib/animaciones'
import { EncuestaHidratada } from '@/wss/tipos'
import { MessageCircleQuestionIcon, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'

export default function EncuestasEstudiante() {
  const { estado, encuestas, error, WssDebugPanel } = useEncuestaEstudiante()

  const encuestasVisibles = encuestas.filter((e) => e.isPublished)

  return (
    <div className="bg-white p-4 md:px-14  md:max-w-[54em] mx-auto rounded-xl">
      <WssDebugPanel />
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-y-8 md:inset-y-16 z-10 w-full h-18 sm:h-24 bg-indigo-200/30 rounded-xl" />
        <div className="relative z-20 flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <LdSvg
              className="w-[100px] md:w-[150px]"
              SvgComponent={Cabeza}
              ids={['cabeza'] as const}
              animation={oscilar(['cabeza'], 2, 1, 0.4)}
            />
            <h1 className="hidden md:block text-[3em] font-bold text-indigo-500">Encuestas</h1>
          </div>
          <div className="flex flex-col items-center justify-center">
            <h1 className="block md:hidden text-2xl font-bold text-indigo-500">Encuestas</h1>
            {estado === StatusDeConexion.Conectado ? (
              <span className="text-emerald-700 animate-pulse">Conectado</span>
            ) : (
              <span className="text-red-700">Desconectado</span>
            )}
          </div>
        </div>
      </div>

      {encuestasVisibles.length > 0 && (
        <>
          {encuestasVisibles.map((e) => (
            <DisplayEncuesta key={e.id} encuesta={e} />
          ))}
        </>
      )}

      {encuestasVisibles.length == 0 && (
        <div className="flex flex-col  items-center mb-10 justify-center">
          <LdSvg
            className="w-[300px] md:w-[500px] grayscale"
            SvgComponent={DibuEstudiante}
            ids={['signo1', 'signo2'] as const}
            animation={oscilar(['signo1', 'signo2'], 2, 1, 0.4)}
          />

          <p className="text-gray-500 text-xl font-bold md:w-[400px] text-center ">
            {error ? error : 'Parece que no hay encuestas activas.'}
          </p>
        </div>
      )}
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: EncuestaHidratada }) {
  const { votar } = useEncuestaEstudiante()
  const [seleccion, setSeleccion] = useState<EncuestaHidratada['opciones'][number]['id'] | undefined>(
    encuesta.votoEmitido
  )
  const [yaVotado, setYaVotado] = useState(!encuesta.puedoVotar)

  const [aportando, setAportando] = useState(false)
  const [aporte, setAporte] = useState('')

  return (
    <div className="flex flex-col gap-4 mt-6 md:p-4 md:m-10 border-dashed border-8 border-indigo-50 shadow-indigo-200 rounded-xl">
      {/* Titulo y opciones */}
      <div className="flex md:gap-6 items-center p-4 justify-between rounded-xl">
        <div
          className={`flex items-start md:items-center text-indigo-500  gap-2 md:gap-4 ${yaVotado ? 'grayscale' : ''}`}
        >
          <MessageCircleQuestionIcon size={40} className="self-start" />
          {/* <LdSvg className='w-[10%]' SvgComponent={Polls}/> */}
          {/* <Image className='md:w-10 md:h-10' src={'/img/iconpoll.png'} height={30} width={30} alt='' /> */}
          <h3 className="w-[90%] break-all text-xs md:text-xl font-bold text-cyan-500">{encuesta.pregunta}</h3>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={`text-xs md:text-sm ${
              encuesta.isOpen ? 'text-emerald-700 animate-pulse duration-1000' : 'text-red-900'
            }`}
          >
            {encuesta.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-[0.1em] md:text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
      </div>

      {/* Una vez votado */}
      <ol className="list-[lower-latin] break-all text-xs ml-10 mr-4 md:text-lg md:ml-16">
        {encuesta.opciones.map((opcion) => (
          <li
            key={opcion.id}
            className={cn('cursor-pointer rounded-md  p-2', {
              'hover:bg-cyan-500/30': !yaVotado && encuesta.isOpen,
              'bg-slate-200 border-white': seleccion === opcion.id,
              'text-slate-300 hover:border-0': yaVotado,
            })}
            onClick={() => {
              setAportando(false)
              if (encuesta.isOpen && !yaVotado) setSeleccion(opcion.id)
            }}
          >
            {opcion.texto} {((yaVotado && encuesta.isRevealed) || !encuesta.isOpen) && <>- {opcion.votos} votos</>}
          </li>
        ))}
        {encuesta.admiteAportes && (
          <Input
            className={cn('mt-2', { 'bg-cyan-500/30': aportando })}
            placeholder="Otra opción"
            value={aporte}
            onClick={() => {
              setAportando(true)
              setSeleccion(undefined)
            }}
            onChange={(e) => {
              setAporte(e.target.value)
            }}
            disabled={!encuesta.admiteAportes || yaVotado || !encuesta.isOpen}
          />
        )}
      </ol>

      {/* Acciones */}
      <div className="flex items-center justify-center gap-4 my-2">
        {yaVotado && <p className="text-md text-rose-800">Ya votaste</p>}
        {encuesta.isOpen && (seleccion || !!aporte.length) && !yaVotado && (
          <button
            className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded"
            onClick={() => {
              if (aportando) {
                votar(encuesta.id, undefined, aporte)
              } else {
                votar(encuesta.id, seleccion)
              }
              setYaVotado(true)
            }}
          >
            <Send size={16} />
            Enviar
          </button>
        )}
      </div>
    </div>
  )
}
