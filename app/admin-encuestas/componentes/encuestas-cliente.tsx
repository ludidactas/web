'use client'
import { cn } from '@/lib/utils'
import { EncuestaHidratada } from '@/polls/encuestas'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { useEncuesta } from './encuestas-context'

export default function EncuestasCliente() {
  const { socket, encuestas } = useEncuesta()

  const encuestasVisibles = encuestas.filter((e) => e.isPublished)

  return (
    <div className="bg-white p-8 max-w-[54em] mx-auto border-x">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Encuestas</h1>
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
        <div className="h-96 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-sm text-center ">No hay encuestas activas.</p>
        </div>
      )}
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: EncuestaHidratada }) {
  const { votar, error } = useEncuesta()
  const [seleccion, setSeleccion] = useState<EncuestaHidratada['opciones'][number]['id']>(encuesta.votoEmitido)
  const [yaVotado, setYaVotado] = useState(!encuesta.puedoVotar)

  return (
    <div className="py-4 max-w-[32em] mx-auto">
      {/* Titulo y opciones */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl">{encuesta.pregunta}</h3>
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
      <ul className="list-disc ml-6">
        {encuesta.opciones.map((opcion) => (
          <li
            key={opcion.id}
            className={cn('cursor-pointer rounded-md hover:bg-slate-100 hover:border p-0.5', {
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
      </ul>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-4 my-2">
        {yaVotado && <p className='text-xs text-slate-400'>Ya votaste</p>}
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

      {/* Error */}
      {error && <div className="text-red-600 text-sm">{error.message}</div>}

      {/* Footer */}
    </div>
  )
}
