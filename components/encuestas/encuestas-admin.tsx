'use client'
import { useState } from 'react'
import { Encuesta, useEncuesta } from './SocketProvider'

export default function EncuestasAdmin() {
  const { socket, encuestas } = useEncuesta()

  return (
    <div className="bg-white p-8">
      <h1 className="text-3xl">Encuestas</h1>
      {socket?.connected ? (
        <span className="text-emerald-700 animate-pulse">Conectado</span>
      ) : (
        <span className="text-red-700">Desconectado</span>
      )}
      {encuestas.length > 0 && (
        <>
          <h2 className="text-2xl mt-4">Existentes:</h2>
          {encuestas.map((e) => (
            <DisplayEncuesta key={e.id} encuesta={e} />
          ))}
        </>
      )}
      <h2 className="text-2xl mt-4">Crear:</h2>
      <AgregarPregunta />
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { cerrarPregunta, borrarPregunta } = useEncuesta()
  return (
    <div className="py-4">
      {/* Titulo y opciones */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl">{encuesta.pregunta}</h3>
        <span className={`text-sm ${encuesta.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
          {encuesta.isActive ? 'Abierta' : 'Cerrada'}
        </span>
      </div>
      <span className="text-gray-500 text-sm">Creada {new Date(encuesta.createdAt).toISOString()}</span>
      <ul className="list-disc ml-6">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            {opcion.texto} - {opcion.votos} votos
          </li>
        ))}
      </ul>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-4 my-2">
        {encuesta.isActive && (
          <button className="bg-blue-900 text-white px-4 py-2 rounded" onClick={() => cerrarPregunta(encuesta.id)}>
            Cerrar
          </button>
        )}
        <button className="bg-red-700 text-white px-4 py-2 rounded" onClick={() => borrarPregunta(encuesta.id)}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

function AgregarPregunta() {
  const { enviarPregunta, error } = useEncuesta()

  const [pregunta, setPregunta] = useState('')
  const [respuestas, setRespuestas] = useState<string[]>([''])

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
      setRespuestas([''])
    })
  }

  return (
    <div className="flex flex-col gap-2 max-w-[696px]">
      <div className="flex gap-4">
        <span>Pregunta:</span>
        <input className="border-b w-full" type="text" value={pregunta} onChange={(e) => setPregunta(e.target.value)} />
      </div>

      {respuestas.map((respuesta, index) => (
        <div key={index} className="flex gap-4 items-center">
          <span className="whitespace-nowrap">Opc. {index + 1}</span>
          <input
            className="border-b w-full"
            type="text"
            value={respuesta}
            onChange={(e) => actualizarRespuesta(index, e.target.value)}
          />
          {respuestas.length > 1 && (
            <button
              className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              onClick={() => eliminarRespuesta(index)}
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button className="bg-blue-900 text-white px-4 py-2 rounded" onClick={agregarRespuesta}>
        + Agregar opción
      </button>
      <button className="bg-emerald-900 text-white px-4 py-2 rounded" onClick={postearPregunta}>
        &gt; Enviar pregunta
      </button>
      {error && <p className="text-xs text-red-900">{error.message}</p>}
    </div>
  )
}
