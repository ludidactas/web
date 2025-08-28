'use client'
import { Encuesta } from '@/polls/encuestas'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Copy, SquareCheckBig } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'
import { useEncuestaAdmin } from './encuestas-profe-context'

export default function EncuestasAdmin() {
  const { conectado, linkSala } = useEncuestaAdmin()
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
      .catch(error => {
        console.error('Failed to copy!', error)
      })
  }

  return (
      <div className="rounded-xl px-20 flex flex-col items-center w-full">
        {/* Link de sala */}
        <div className="md:w-[40em] bg-white p-6 md:p-10 rounded-xl">
          {linkSala && (
            <div className='flex items-center gap-4 justify-center mb-8'>
            <p className='text-center leading-normal text-xs md:text-lg'>
              Tu sala:{' '}
              <Link href={linkSala} className="text-blue-700 hover:underline">
                {linkSala}
              </Link>
            </p>
            <button  onClick={handleCopy(linkSala)}
              > 
                {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
              </button>
          </div>
          )}
  
        {!linkSala && <span>Link de sala no recibido</span>}

        {/* Barra de status */}
        <Status />

        <hr className="invisible py-2" />
        {conectado && (
          <>
            <AgregarPregunta />
            <ListaEncuestas />
          </>
        )}
        {!conectado && (
          <div className="text-center">
            <p className="text-xl m-4">¡Ups! No se puede conectar con el servidor</p>
            <p>
              Checkeá tu conexión, actualizá la página, o envianos un mensaje <span className="text-cyan-500">ludidactas.adm@gmail.com</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Status() {
  const { conectado } = useEncuestaAdmin()
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl">Encuestas</h1>
      {conectado ? (
        <span className="text-emerald-700 animate-pulse">Conectado</span>
      ) : (
        <span className="text-red-700">Desconectado</span>
      )}
    </div>
  )
}

function ListaEncuestas() {
  const { encuestas } = useEncuestaAdmin()
  if (encuestas.length == 0)
    return <></>

  return (
    <>
      <h2 className="text-xl md:text-2xl mt-4">Existentes:</h2>
      {encuestas.map((e) => (
        <DisplayEncuesta key={e.id} encuesta={e} />
      ))}
    </>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { cerrarPregunta, borrarPregunta, abrirPregunta, publicarPregunta, esconderPregunta } = useEncuestaAdmin()
  return (
    <div className="py-4">
      {/* Titulo y status */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-xl">{encuesta.pregunta}</h3>
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

      <ul className="list-disc ml-6">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            {opcion.texto} - {opcion.votos} votos
          </li>
        ))}
      </ul>

      {/* Acciones */}

      {/* Publicar/esconder */}
      <div className="flex items-center justify-end gap-4 my-2">
        {!encuesta.isPublished && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-green-700 text-white px-4 py-2 rounded"
            onClick={() => publicarPregunta(encuesta.id)}
          >
            Publicar
          </button>
        )}
        {encuesta.isPublished && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-green-100 text-black px-2 md:px-4 py-2 rounded border border-green-900"
            onClick={() => esconderPregunta(encuesta.id)}
          >
            Esconder
          </button>
        )}

        {/* Abrir/Cerrar */}
        {!encuesta.isOpen && (
          <button className="w-20 text-xs md:text-xl md:w-32 bg-blue-900 text-white px-2 md:px-4 py-2 rounded" onClick={() => abrirPregunta(encuesta.id)}>
            Abrir
          </button>
        )}
        {encuesta.isOpen && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-blue-100 text-black px-2 md:px-4 py-2 rounded border border-blue-900"
            onClick={() => cerrarPregunta(encuesta.id)}
          >
            Cerrar
          </button>
        )}

        {/* Eliminar */}
        <button className="w-20 text-xs md:text-xl md:w-32 bg-red-800 text-white px-4 py-2 rounded" onClick={() => borrarPregunta(encuesta.id)}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

function AgregarPregunta() {
  const { enviarPregunta } = useEncuestaAdmin()

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
    enviarPregunta(pregunta, respuestas).then(() => {
      setPregunta('')
      setRespuestas(['', ''])
    })
  }

  return (
    <div className="flex flex-col bg-slate-200 p-4 gap-2">
      <p>Pregunta:</p>
      <textarea
        className="border-b w-full resize-none"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
      />

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
              className="text-red-700 border border-b-2 border-r-2 hover:border-b-4 hover:border-r-4 border-red-700 px-2 py-1 rounded text-sm transition-all duration-100 h-8"
              onClick={() => eliminarRespuesta(index)}
            >
              X
            </button>
          )}
        </div>
      ))}

      <button className="bg-blue-900 text-white px-2 md:px-4 py-2 rounded" onClick={agregarRespuesta}>
        + Agregar opción
      </button>
      <button className="bg-emerald-900 text-white px-2 md:px-4 py-2 rounded" onClick={postearPregunta}>
        &gt; Enviar pregunta
      </button>
    </div>
  )
}
