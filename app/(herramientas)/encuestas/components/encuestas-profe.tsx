'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import EncuestasIcon from '@/svg/encuestas.svg'
import PollsIcon from '@/svg/pollsvgo.svg'
import { Encuesta } from '@/wss/tipos'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Copy, SquareCheckBig } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'
import { useEncuestaAdmin } from './encuestas-profe-context'
import { estudianteSala } from '@/wss/polls/app'
import { cn } from '@/lib/utils'

export default function EncuestasAdmin() {
  const { conectado, linkSala, estudiantes } = useEncuestaAdmin()
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

  return (
    <div className="rounded-xl md:px-20 flex flex-col items-center w-full">
      {/* Link de sala */}
      <div className="md:w-[40em] bg-white p-6 md:p-10 rounded-xl">
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
              Checkeá tu conexión, actualizá la página, o envianos un mensaje{' '}
              <span className="text-cyan-500">ludidactas.adm@gmail.com</span>
            </p>
          </div>
        )}
      </div>
      {estudiantes.length === 0 && <p className="mt-10 text-slate-400 italic">Ningún estudiante conectado aún...</p>}
      {estudiantes.length > 0 && (
        <ul className="py-4">
          {estudiantes.map((e) => (
            <li key={e.sessionId} className={cn({ 'text-black': e.conectado, 'text-slate-400': !e.conectado })}>
              {e.nombre} - {e.email ?? `Anónimo`}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Status() {
  const { conectado } = useEncuestaAdmin()
  return (
    <div className="relative flex items-center justify-between pr-4 mb-4">
      <div className="absolute inset-y-4 rounded-xl bg-indigo-50 w-full h-24" />

      <div className="flex relative items-center justify-between">
        <LdSvg className="w-40" SvgComponent={EncuestasIcon} />
        <h1 className="text-xl md:text-3xl font-bold text-indigo-500">Encuestas</h1>
      </div>

      {/* <h1 className="text-3xl">Encuestas</h1> */}
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
  if (encuestas.length == 0) return <></>

  return (
    <div className="p-4">
      {encuestas.map((e) => (
        <DisplayEncuesta key={e.id} encuesta={e} />
      ))}
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { cerrarPregunta, borrarPregunta, abrirPregunta, publicarPregunta, esconderPregunta } = useEncuestaAdmin()
  return (
    <div className="p-4 m-4 rounded-xl border-4 border-indigo-50">
      {/* Titulo y status */}
      <div className="flex items-center px-4 justify-between">
        <div className="flex gap-4 items-center">
          <LdSvg className="w-10" SvgComponent={PollsIcon} />
          <h3 className="text-sm md:text-xl">{encuesta.pregunta}</h3>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`text-sm ${encuesta.isOpen ? 'text-emerald-700 animate-pulse duration-1000' : 'text-rose-800'}`}
          >
            {encuesta.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
      </div>

      <ol className="list-[lower-latin] px-8 m-6">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            <div className="flex gap-2">
              {opcion.texto} - <p className="text-emerald-500 font-bold"> {opcion.votos} votos </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Acciones */}

      {/* Publicar/esconder */}
      <div className="flex items-center justify-center gap-4 my-2">
        {!encuesta.isPublished && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-emerald-500 text-white px-4 py-2 rounded"
            onClick={() => publicarPregunta(encuesta.id)}
          >
            Publicar
          </button>
        )}
        {encuesta.isPublished && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-emerald-100 text-black px-2 md:px-4 py-2 rounded border border-green-900"
            onClick={() => esconderPregunta(encuesta.id)}
          >
            Esconder
          </button>
        )}

        {/* Abrir/Cerrar */}
        {!encuesta.isOpen && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
            onClick={() => abrirPregunta(encuesta.id)}
          >
            Abrir
          </button>
        )}
        {encuesta.isOpen && (
          <button
            className="w-20 text-xs md:text-xl md:w-32 bg-indigo-100 text-black px-2 md:px-4 py-2 rounded border border-blue-900"
            onClick={() => cerrarPregunta(encuesta.id)}
          >
            Cerrar
          </button>
        )}

        {/* Eliminar */}
        <button
          className="w-20 text-xs md:text-xl md:w-32 bg-rose-800/90 text-white px-4 py-2 rounded"
          onClick={() => borrarPregunta(encuesta.id)}
        >
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
        className="bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
        onClick={agregarRespuesta}
        tabIndex={respuestas.length + 2}
      >
        + Agregar opción
      </button>
      <button
        className="bg-emerald-500 text-white px-2 md:px-4 py-2 rounded"
        onClick={postearPregunta}
        tabIndex={respuestas.length + 2}
      >
        &gt; Enviar pregunta
      </button>
    </div>
  )
}
