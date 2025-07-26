'use client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { useEncuesta } from './encuestas-context'
import { Encuesta } from '@/polls/encuestas'
import { pollBase } from '@/polls/validators'
import { cn } from '@/lib/utils'

export default function EncuestasAdmin() {
  return (
    <div className="bg-white p-0 sm:p-8 flex flex-col items-center w-full">
      <div className="w-full max-w-[690px]">
        <Status />
        <hr className="invisible py-2" />
        <AgregarPregunta />
        <ListaEncuestas />
      </div>
    </div>
  )
}

function Status() {
  const { socket } = useEncuesta()
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between">
      <h1 className="text-3xl">Encuestas</h1>
      {socket?.connected ? (
        <span className="text-emerald-700 animate-pulse">Conectado</span>
      ) : (
        <span className="text-red-700">Desconectado</span>
      )}
    </div>
  )
}

function ListaEncuestas() {
  const { encuestas } = useEncuesta()
  if (encuestas.length == 0)
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <p className="text-gray-500 text-sm text-center ">No hay encuestas.</p>
      </div>
    )

  return (
    <>
      <h2 className="text-2xl mt-4">Existentes:</h2>
      {encuestas.map((e) => (
        <DisplayEncuesta key={e.id} encuesta={e} />
      ))}
    </>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { cerrarPregunta, borrarPregunta, abrirPregunta, publicarPregunta, esconderPregunta } = useEncuesta()

  const status =
    encuesta.isOpen && encuesta.isPublished
      ? 'Activa'
      : encuesta.isOpen && !encuesta.isPublished
      ? 'Abierta'
      : !encuesta.isOpen && encuesta.isPublished
      ? 'Publicada'
      : 'Cerrada'

  return (
    <div className="py-4 mx-auto">
      {/* Titulo y status */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl">{encuesta.pregunta}</h3>

        <div className="flex flex-col items-end">
          <span
            className={cn('text-sm', {
              'text-emerald-700 animate-pulse duration-1000': status === 'Activa',
              'text-amber-500': status === 'Publicada' || status === 'Abierta',
              'text-red-900': status === 'Cerrada',
            })}
          >
            {status}
          </span>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>

      </div>

      <ul className="list-disc ml-6">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            {opcion.texto} - {opcion.votos} votos
          </li>
        ))}
      </ul>

      {/* Acciones */}

      {/* Publicar/esconder */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 my-2">
        {!encuesta.isPublished && (
          <button
            className="w-32 bg-green-700 text-white px-4 py-2 rounded"
            onClick={() => publicarPregunta(encuesta.id)}
          >
            Publicar
          </button>
        )}
        {encuesta.isPublished && (
          <button
            className="w-32 bg-green-100 text-black px-4 py-2 rounded border border-green-900"
            onClick={() => esconderPregunta(encuesta.id)}
          >
            Esconder
          </button>
        )}

        {/* Abrir/Cerrar */}
        {!encuesta.isOpen && (
          <button className="w-32 bg-blue-900 text-white px-4 py-2 rounded" onClick={() => abrirPregunta(encuesta.id)}>
            Abrir
          </button>
        )}
        {encuesta.isOpen && (
          <button
            className="w-32 bg-blue-100 text-black px-4 py-2 rounded border border-blue-900"
            onClick={() => cerrarPregunta(encuesta.id)}
          >
            Cerrar
          </button>
        )}

        {/* Eliminar */}
        <button className="w-32 bg-red-800 text-white px-4 py-2 rounded" onClick={() => borrarPregunta(encuesta.id)}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

function AgregarPregunta() {
  const { enviarPregunta, error } = useEncuesta()

  const [pregunta, setPregunta] = useState('')
  const [respuestas, setRespuestas] = useState<string[]>(['', ''])

  const { success } = pollBase.safeParse({ pregunta, opciones: respuestas })

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
    enviarPregunta(pregunta, respuestas).then(() => {
      setPregunta('')
      setRespuestas(['', ''])
    })
  }

  const estiloInputs = (txt: string) => cn(
    'border-b w-full resize-none mb-6',
    'focus:outline-none focus:ring-2 ring-emerald-100 p-2 rounded-sm h-24',
    {
      'ring-red-200': txt.length == 0,
      'text-sm h-40 sm:h-24': txt.length > 100,
      'text-xs h-60 sm:h-40': txt.length > 300,
      'sm:text-sm sm:h-32': txt.length > 200,
      'sm:text-xs sm:h-40': txt.length > 600,
    }
  )

  return (
    <div className="flex flex-col gap-2">
      <p className="text-slate-500">Pregunta:</p>
      <textarea className={estiloInputs(pregunta)} value={pregunta} onChange={(e) => setPregunta(e.target.value)} />

      {/* Lista de opciones */}
      <div className="flex flex-col gap-4 mb-8">
        {respuestas.map((respuesta, index) => (
          <div className="flex flex-col gap-2" key={index}>
            <div key={index} className="flex gap-4 items-center justify-between">
              <span className="whitespace-nowrap text-slate-500">Opc. {index + 1} </span>

              {respuestas.length > 1 && (
                <button
                  className="text-red-700 border border-b-2 border-r-2 hover:border-b-4 hover:border-r-4 border-red-700 px-2 py-1 rounded text-sm transition-all duration-100 h-8"
                  onClick={() => eliminarRespuesta(index)}
                >
                  X
                </button>
              )}
            </div>
            <textarea
              className={estiloInputs(respuesta)}
              value={respuesta}
              onChange={(e) => actualizarRespuesta(index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="bg-blue-900 text-white px-4 py-2 rounded" onClick={agregarRespuesta}>
        + Agregar opción
      </button>
      <button
        className="bg-emerald-900 text-white px-4 py-2 rounded disabled:bg-slate-200"
        onClick={postearPregunta}
        disabled={!success}
      >
        &gt; Enviar pregunta
      </button>
      {error && <p className="text-xs text-red-900">{error.message}</p>}
    </div>
  )
}
