'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import useConfirmarConDelay from '@/components/hooks/use-delay'
import { Input } from '@/components/ui/input'
import { oscilar } from '@/lib/animaciones'
import { cn } from '@/lib/utils'
import IconEnc from '@/svg/dist/encuestas/EncuestaIcon.svg'
import { EncuestaHidratadaEstudiante } from '@/wss/validators/polls'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Circle, CircleCheckBig, MessageCircleQuestionIcon, Send, Square, SquareCheckBig } from 'lucide-react'
import { useEffect, useState } from 'react'
import LoadingSala from '../loading-sala'
import Cabeza from '/svg/dist/ilustraciones/cabezas.svg'
import DibuEstudiante from '/svg/dist/ilustraciones/ups.svg'

import DebugPanel from '@/components/ui/debug-panel'
import { StatusDeConexion, statusesDeCarga } from '@/wss-cli/conexion-wss'
import { useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { intersection } from 'remeda'
import { storeEncuestasEstudiante } from '@/wss-cli/stores/encuestas-store'

export default function EncuestasEstudiante({ idSala }: { idSala: string }) {
  const { estado, error } = useConexionEstudiante()

  const { items: encuestas } = storeEncuestasEstudiante()

  const { config } = storeConfig()

  // Confirmamos con delay si no hay encuestas, para evitar mostrar el mensaje de "no hay encuestas" durante la carga inicial.
  const { valor: posibleVacio, confirmado: confirmadoVacio } = useConfirmarConDelay(
    () => estado === StatusDeConexion.Conectado && encuestas.length === 0,
    1000
  )
  const encuestasVisibles = encuestas.filter((e) => e.isPublished)
  const conectando = statusesDeCarga.includes(estado)

  if (conectando || (posibleVacio && !confirmadoVacio))
    return <LoadingSala overlay mensaje="Contactando con server de salas..." />

  return (
    <div>
      <div className="flex flex-col md:px-10 md:mx-10 gap-4">
        <div className="flex flex-col px-4 items-center justify-center md:gap-10 bg-white rounded-3xl md:p-10">
          <div className="flex flex-col md:flex-row items-center md:gap-10">
            <LdSvg
              className="w-[100px] md:w-[200px]"
              SvgComponent={Cabeza}
              ids={['cabeza'] as const}
              animation={oscilar(['cabeza'], 2, 1, 0.4)}
            />

            <div className="flex flex-col text-center text-lg md:text-3xl">
              <p>
                Estás en la{' '}
                <span className="text-lg md:text-4xl text-[#8345FE] rounded-full md:px-4 ">
                  Sala de Encuestas
                  <LdSvg className="w-10 md:w-20 inline-block mx-1" SvgComponent={IconEnc} />
                </span>
                de
              </p>
              <p className="text-teal-500"> {config?.nombre_profe ?? idSala}</p>
              <p className="text-xs md:text-2xl p-4">¡Participa respondiendo a las preguntas en vivo!</p>
            </div>
          </div>

          {encuestasVisibles.length > 0 && (
            <div className="w-full flex flex-col py-10 gap-2 items-center">
              {encuestasVisibles.map((e) => (
                <DisplayEncuesta key={e.id} encuesta={e} />
              ))}
            </div>
          )}

          {confirmadoVacio && posibleVacio && (
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
      </div>
    </div>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: EncuestaHidratadaEstudiante }) {
  const { votar } = useConexionEstudiante()

  const emitidos = encuesta.votosEmitidos ?? []

  const [seleccion, setSeleccion] = useState<EncuestaHidratadaEstudiante['opciones'][number]['id'][]>(emitidos)

  useEffect(() => {
    // Si la encuesta cambia actualizamos las opciones seleccionadas a las que diga el server.
    setSeleccion(encuesta.votosEmitidos ?? [])
  }, [encuesta])

  const [aportando, setAportando] = useState(false)
  const [aporte, setAporte] = useState('')

  /** Permite votar el server? */
  const yaVotado = !encuesta.puedoVotar

  /** Puede enviar si le está permitido y tiene algo seleccionado que enviar */
  const cambioSeleccion = intersection(seleccion, emitidos).length !== seleccion.length
  const hayAporte = aporte.trim().length > 0
  const puedeEnviar = encuesta.isOpen && encuesta.puedoVotar && (cambioSeleccion || hayAporte)

  function enviarVoto() {
    if (!puedeEnviar) {
      console.warn('Tratando de votar en encuestra donde no puede enviar!')
      return
    }

    // Si hay un aporte textual...
    if (aportando) {
      votar({ pollId: encuesta.id, tipo: 'aporte', aporte })
      setAporte('')
      setAportando(false)
    }

    // Si hay una opción u opciones...
    if (seleccion.length > 0) {
      seleccion?.forEach((optionId) => {
        if (!encuesta.votosEmitidos?.includes(optionId)) votar({ pollId: encuesta.id, tipo: 'opcion', optionId })
      })
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col w-full md:w-2/3 gap-4 md:p-8 border-indigo-500/70 border-2 p-4 md:border-4 rounded-xl relative',
        yaVotado && 'border-slate-300'
      )}
    >
      <DebugPanel
        classNames={{ button: 'absolute bottom-4' }}
        data={{
          seleccion,
          encuesta,
          cambioSeleccion,
          hayAporte,
          puedeEnviar,
        }}
      />

      {/* Header - Titulo y status */}
      <HeaderEncuestaEstudiante encuesta={encuesta} />

      {/* Opciones */}
      <ol className=" break-all text-xs mx-4 md:text-lg flex flex-col gap-2">
        {encuesta.opciones.map((opcion) => {
          const seleccionada = seleccion && seleccion?.includes(opcion.id)

          // Si viene del server quiere decir que ya está emitido el voto para esa opción.
          const establecida = seleccionada && emitidos.includes(opcion.id)

          // Computamos el max efectivo:
          // - si tiene max, es ese,
          // - si no tiene max pero no admite aportes, es el numero de opciones,
          // - si no tiene max y admite aportes, es infinito.
          const maxEfectivo = encuesta.maxMultiplesVotos
            ? encuesta.maxMultiplesVotos
            : !encuesta.admiteAportes
            ? encuesta.opciones.length
            : Infinity

          return (
            <li
              key={opcion.id}
              className={cn('cursor-pointer rounded-md  p-2', {
                'hover:bg-cyan-500/30': !yaVotado && encuesta.isOpen,
                'bg-slate-200 border-white': seleccionada,
                'text-slate-400 hover:border-transparent': yaVotado,
                'border border-slate-700': establecida,
              })}
              onClick={() => {
                // Si estaba aportando, desactivamos.
                setAportando(false)

                // Si la opción está seleccionada y dentro de las ya emitidas, al hacer click no se deselecciona.
                if (establecida) return

                // Si la opción no estaba seleccionada, y ya tengo el maximo de opciones seleccionadas, no se puede seleccionar más.
                if (!seleccionada && seleccion.length >= maxEfectivo) return

                // Si la encuesta no está abierta o ya voté, no se puede seleccionar nada.
                if (!encuesta.isOpen || yaVotado) return

                // Si no admite multiples votos, al seleccionar una opción se deseleccionan las demás.
                if (!encuesta.admiteMultiplesVotos) {
                  setSeleccion([opcion.id])
                }
                // Si ya estaba seleccionada, al hacer click se deselecciona.
                else if (seleccionada) {
                  setSeleccion(seleccion.filter((id) => id !== opcion.id))
                }
                // Si admite multiples, se añade a las seleccionadas.
                else {
                  setSeleccion([...(seleccion ?? []), opcion.id])
                }
              }}
            >
              <span className="flex items-center gap-2">
                {/* Checkbox */}
                {encuesta.admiteMultiplesVotos && !seleccionada && <Square className="shrink-0" />}
                {encuesta.admiteMultiplesVotos && seleccionada && <SquareCheckBig className="shrink-0" />}
                {/* Radio */}
                {!encuesta.admiteMultiplesVotos && !seleccionada && <Circle className="shrink-0" />}
                {!encuesta.admiteMultiplesVotos && seleccionada && <CircleCheckBig className="shrink-0" />}

                {/* Texto */}
                <span className="break-normal">{opcion.texto}</span>

                {/* Apéndice de votos */}
                {encuesta.isRevealed && (
                  <span className="break-normal shrink-0 self-end">
                    - {opcion.votos} {opcion.votos === 1 ? 'voto' : 'votos'}
                  </span>
                )}
              </span>
            </li>
          )
        })}

        {/* Input de aportes en caso que la encuesta lo admita */}
        {encuesta.admiteAportes && (
          <Input
            className={cn('mt-2 text-xs bg-slate-100', { 'bg-cyan-500/30': aportando })}
            placeholder="Otra respuesta..."
            value={aporte}
            onClick={() => {
              setAportando(true)
              if (!encuesta.admiteMultiplesVotos) setSeleccion([]) // Si no admite múltiples, al hacer click en aportar se deseleccionan las opciones
            }}
            onChange={(e) => {
              setAporte(e.target.value)
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                enviarVoto()
              }
            }}
            disabled={!encuesta.admiteAportes || yaVotado || !encuesta.isOpen}
          />
        )}
      </ol>

      <span className="text-xs text-center text-slate-400">{encuesta.admiteAportes && 'Podés añadir respuestas'}</span>
      <span className="text-xs text-center text-slate-400">
        {/* Si no admite múltiples puede seleccionar una */}
        {!encuesta.admiteMultiplesVotos && 'Podés eleccionar una sola opción.'}

        {/* Si admite múltiples y tiene max, es ese */}
        {encuesta.admiteMultiplesVotos &&
          encuesta.maxMultiplesVotos &&
          `Podés seleccionar hasta ${encuesta.maxMultiplesVotos} opciones.`}

        {/* Si admite aportes y multiples y no tiene max, puede seleccionar infinito */}
        {encuesta.admiteMultiplesVotos && !encuesta.maxMultiplesVotos && 'Podés seleccionar varias opciones.'}
      </span>

      {/* Acciones */}
      <div className="flex items-center justify-center gap-4 my-2">
        {/* Mensaje de Ya votaste */}
        {yaVotado && <p className="text-md text-rose-800">Ya votaste</p>}

        {!encuesta.isOpen && <p className="text-md text-rose-800">Encuesta cerrada</p>}

        {/* Botón de Enviar */}
        {!yaVotado && encuesta.isOpen && (
          <button
            className={cn(
              'flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded',
              !puedeEnviar && 'grayscale cursor-not-allowed'
            )}
            disabled={!puedeEnviar}
            onClick={enviarVoto}
          >
            <Send size={16} />
            Enviar
          </button>
        )}
      </div>
    </div>
  )
}

function HeaderEncuestaEstudiante({ encuesta }: { encuesta: EncuestaHidratadaEstudiante }) {
  return (
    <div className="flex gap-4 md:gap-6 items-start justify-between rounded-xl">
      {/* Icono */}
      <div className={cn('flex items-center text-indigo-500  gap-2 md:gap-4', !encuesta.puedoVotar && 'grayscale')}>
        <MessageCircleQuestionIcon className="w-10 h-10 md:w-16 md:h-16 self-start shrink-0" />
        <h3 className="w-[90%] break-all text-xs md:text-xl font-bold text-cyan-500">{encuesta.pregunta}</h3>
      </div>

      {/* Status */}
      <div className="flex flex-col items-end">
        <span
          className={`text-xs md:text-sm ${
            encuesta.isOpen ? 'text-emerald-700 animate-pulse duration-1000' : 'text-red-900'
          }`}
        >
          {encuesta.isOpen ? 'Abierta' : 'Cerrada'}
        </span>
        <span className="text-[0.07em] text-right md:text-xs text-slate-400">
          {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: false, locale: es })}
        </span>
      </div>
    </div>
  )
}
