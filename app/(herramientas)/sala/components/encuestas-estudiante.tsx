'use client'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
// import Image from 'next/image'
import { useState } from 'react'
import { useEncuestaEstudiante } from './encuestas-estudiante-context'
import { LdSvg } from '@/components/custom/ld-svg'
import DibuEstudiante from '/svg/upssvgo.svg'
import Cabeza from '/svg/cabezasvgo.svg'
import Polls from '/svg/pollsvgo.svg'
import { oscilar } from '@/lib/animaciones'
import { EncuestaHidratada } from '@/wss/tipos'
import { StatusDeConexion } from '../../encuestas/components/use-conexion-wss'

export default function EncuestasEstudiante() {
  const { estado, encuestas, error } = useEncuestaEstudiante()

  const encuestasVisibles = encuestas.filter((e) => e.isPublished)

  return (
    <div className="bg-white p-4 md:px-14 md:max-w-[54em] mx-auto rounded-xl">

      {/* Header */}
      <div className="relative">
        <div className='absolute inset-y-8 md:inset-y-16 z-10 w-full h-24 bg-indigo-200/30 rounded-xl' />
        <div className="relative z-20 flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <LdSvg className="w-[100px] md:w-[150px]" SvgComponent={Cabeza}
              ids={['cabeza'] as const}
              animation={oscilar(['cabeza'], 2, 1, 0.4)} />
            <h1 className="hidden md:block text-[3em] font-bold text-indigo-500">Encuestas</h1>
          </div>
          <div className='flex flex-col items-center justify-center'>

          <h1 className="block md:hidden text-3xl font-bold text-indigo-500">Encuestas</h1>

          {estado === StatusDeConexion.Conectado ? (
            <span className="text-emerald-700 animate-pulse">Conectado</span>
          ) : (
            <span className="text-red-700">Desconectado</span>
          )}
          </div>
        </div>
      </div>
      {/* {session.current?.nombre && <p>Participando como { session.current.nombre }</p>} */}
      {/* {nombre && <p>Participando como {nombre}</p>} */}


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
            animation={oscilar(['signo1', 'signo2'], 2, 1, 0.4)} />

          <p className="text-gray-500 text-xl font-bold md:w-[400px] text-center ">{error ? error : 'Parece que no hay encuestas activas.'}</p>

        </div>
      )}
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: EncuestaHidratada }) {
  const { votar } = useEncuestaEstudiante()
  const [seleccion, setSeleccion] = useState<EncuestaHidratada['opciones'][number]['id'] | undefined>(encuesta.votoEmitido)
  const [yaVotado, setYaVotado] = useState(!encuesta.puedoVotar)

  return (
    <div className="flex flex-col gap-4 mt-6 md:p-4 md:m-10 border-dashed border-8 border-indigo-50 shadow-indigo-200 rounded-xl">
      {/* Titulo y opciones */}
      <div className="flex md:gap-6 items-center p-4 justify-between rounded-xl">
        <div className={`flex items-start md:items-center gap-2 md:gap-4 ${yaVotado ? 'grayscale' : ''}`}>
          <LdSvg className='w-[10%]' SvgComponent={Polls}
          />
          {/* <Image className='md:w-10 md:h-10' src={'/img/iconpoll.png'} height={30} width={30} alt='' /> */}
          <h3 className="w-[90%] text-xs md:text-xl font-bold text-cyan-500">{encuesta.pregunta}</h3>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={`text-xs md:text-sm ${encuesta.isOpen ? 'text-emerald-700 animate-pulse duration-1000' : 'text-red-900'}`}
          >
            {encuesta.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-[0.1em] md:text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
      </div>

      {/* Una vez votado */}
      <ol className="list-[lower-latin] text-xs ml-10 mr-4 md:text-lg md:ml-16">
        {encuesta.opciones.map((opcion) => (
          <li
            key={opcion.id}
            className={cn('cursor-pointer rounded-md hover:bg-cyan-500/30 hover:border p-2', {
              'bg-slate-200 border-2 border-slate-900': seleccion === opcion.id && !yaVotado,
              'text-slate-300': yaVotado && opcion.id !== seleccion,
            })}
            onClick={() => {
              if (encuesta.isOpen && !yaVotado) setSeleccion(opcion.id)
            }}
          >
            {opcion.texto} {(yaVotado || !encuesta.isOpen) && <>- {opcion.votos} votos</>}
          </li>
        ))}
      </ol>

      {/* Acciones */}
      <div className="flex items-center justify-center gap-4 my-2">
        {yaVotado && <p className='text-md text-red-800'>Ya votaste</p>}
        {encuesta.isOpen && seleccion && !yaVotado && (
          <button
            className="bg-blue-900 text-white px-4 py-2 rounded"
            onClick={() => {
              votar(encuesta.id, seleccion)
              setYaVotado(true)
            }}
          >
            Enviar
          </button>
        )}
      </div>
    </div>
  )
}
