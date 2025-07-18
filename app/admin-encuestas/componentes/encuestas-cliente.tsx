'use client'
import { useState } from 'react'
import { Encuesta, useEncuesta } from './SocketProvider'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function EncuestasCliente() {
  const { socket, encuestas } = useEncuesta()

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
      {encuestas.length > 0 && (
        <>
          {encuestas.map((e) => (
            <DisplayEncuesta key={e.id} encuesta={e} />
          ))}
        </>
      )}
      {encuestas.length == 0 && (
        <div className="h-96 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-sm text-center ">No hay encuestas activas.</p>
        </div>
      )}
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { votar, error } = useEncuesta()
  const [seleccion, setSeleccion] = useState<Encuesta['opciones'][number]>(undefined)
  const [yaVotado, setYaVotado] = useState(false)

  return (
    <div className="py-4 max-w-[32em] mx-auto">
      {/* Titulo y opciones */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl">{encuesta.pregunta}</h3>
        <span className={`text-sm ${encuesta.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
          {encuesta.isActive ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      {encuesta.isActive && (
        <span className="text-gray-500 text-sm">
          Abierta {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
        </span>
      )}

      {/* Una vez votado */}
      <ul className="list-disc ml-6">
        {encuesta.opciones.map((opcion) => (
          <li
            key={opcion.id}
            className={cn('cursor-pointer rounded-md hover:bg-slate-100 hover:border p-0.5', {
              'bg-slate-200 border-2 border-slate-900': seleccion?.id === opcion.id && !yaVotado,
              'text-slate-300': yaVotado && opcion.id !== seleccion?.id,
            })}
            onClick={() => {
              if (encuesta.isActive && !yaVotado) setSeleccion(opcion)
            }}
          >
            {opcion.texto} {(yaVotado || !encuesta.isActive) && <>- {opcion.votos} votos</>}
          </li>
        ))}
      </ul>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-4 my-2">
        {encuesta.isActive && seleccion && !yaVotado && (
          <button
            className="bg-blue-900 text-white px-4 py-2 rounded"
            onClick={() => {
              votar(encuesta.id, seleccion.id)
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
