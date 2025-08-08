'use client'
import { cn } from '@/lib/utils'
import { EncuestaHidratada } from '@/polls/encuestas'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { useEncuestaEstudiante } from './encuestas-estudiante-context'
import Image from 'next/image'

export default function EncuestasEstudiante() {
  const { socket, encuestas, session } = useEncuestaEstudiante()

  const encuestasVisibles = encuestas.filter((e) => e.isPublished)

  return (
    <div className="bg-white p-14 max-w-[54em] mx-auto rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">Encuestas</h1>
        </div>
        {socket?.connected ? (
          <span className="text-emerald-700 animate-pulse">Conectado</span>
        ) : (
          <span className="text-red-700">Desconectado</span>
        )}
      </div>

      {encuestasVisibles.length > 0 && (
        <>
          {encuestasVisibles.map((e) => (
            <DisplayEncuesta key={e.id} encuesta={e} />
          ))}
        </>
      )}

      {encuestasVisibles.length == 0 && (
        <div className="h-full flex flex-col items-center justify-center">
          <Image className='rounded-full grayscale m-16 shadow-xl' height={300} src={'/img/svgilustracion.png'} width={300} alt='' />
          <p className="text-gray-500 text-lg text-center ">¡Ups! Parece que no hay encuestas activas.</p>
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
    <div className="flex flex-col gap-4 p-4 m-10 shadow-lg border border-indigo-200 shadow-indigo-200 rounded-xl">
      {/* Titulo y opciones */}
      <div className="flex gap-6 items-center p-4 rounded-xl justify-between ">
        <div className='flex items-center gap-4'>
          <Image className='w-10 h-10' src={'/img/iconpoll.png'} height={30} width={30} alt='' />
          <h3 className="text-xl font-bold text-cyan-500">{encuesta.pregunta}</h3>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={`text-sm ${encuesta.isOpen ? 'text-emerald-700 animate-pulse duration-1000' : 'text-red-900'}`}
          >
            {encuesta.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
      </div>

      {/* Una vez votado */}
      <ol className="list-[lower-latin] ml-16">
        {encuesta.opciones.map((opcion) => (
          <li
            key={opcion.id}
            className={cn('cursor-pointer rounded-md hover:bg-cyan-500/30 hover:border p-0.5', {
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
        {yaVotado && <p className='text-md text-red-900'>Ya votaste</p>}
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
