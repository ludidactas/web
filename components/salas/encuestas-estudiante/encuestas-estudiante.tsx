'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import useConfirmarConDelay from '@/components/hooks/use-delay'
import { Input } from '@/components/ui/input'
import { oscilar } from '@/lib/animaciones'
import { cn } from '@/lib/utils'
import IconEnc from '@/svg/EncuestaIconSVGO.svg'
import { EncuestaHidratada } from '@/wss/tipos'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageCircleQuestionIcon, Send } from 'lucide-react'
import { useState } from 'react'
import LoadingSala from '../loading-sala'
import Cabeza from '/svg/cabezasvgo.svg'
import DibuEstudiante from '/svg/upssvgo.svg'

import { StatusDeConexion, statusesDeCarga } from '@/wss-cli/conexion-wss'
import { useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storeEncuestas } from '@/wss-cli/stores/encuestas-store'

export default function EncuestasEstudiante({ idSala }: { idSala: string }) {
  const { estado, error, WssDebugPanel } = useConexionEstudiante()

  const { items: encuestas } = storeEncuestas()

  const { config } = storeConfig()
  const { valor: posibleVacio, confirmado: confirmadoVacio } = useConfirmarConDelay(
    () => StatusDeConexion.Conectado && encuestas.length === 0,
    1000
  )
  const encuestasVisibles = encuestas.filter((e) => e.isPublished)
  const conectando = statusesDeCarga.includes(estado)

  if (conectando || (posibleVacio && !confirmadoVacio))
    return <LoadingSala overlay mensaje="Contactando con server de salas..." />

  return (
    <div>
      <div className="flex flex-col md:px-10 md:mx-10 gap-4">
        {process.env.NODE_ENV === 'development' && <WssDebugPanel />}
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

function DisplayEncuesta({ encuesta }: { encuesta: EncuestaHidratada }) {
  const { votar } = useConexionEstudiante()
  const [seleccion, setSeleccion] = useState<EncuestaHidratada['opciones'][number]['id'] | undefined>(
    encuesta.votoEmitido
  )
  const [yaVotado, setYaVotado] = useState(!encuesta.puedoVotar)

  const [aportando, setAportando] = useState(false)
  const [aporte, setAporte] = useState('')

  return (
    <div
      className={`flex flex-col w-full md:w-2/3 gap-4 md:p-8 border-indigo-500/70 border-2 p-4 md:border-4 rounded-xl ${
        yaVotado ? 'border-slate-300' : ''
      }`}
    >
      {/* Titulo y opciones */}
      <div className="flex gap-4 md:gap-6 items-start justify-between rounded-xl">
        <div className={`flex items-center text-indigo-500  gap-2 md:gap-4 ${yaVotado ? 'grayscale' : ''}`}>
          <MessageCircleQuestionIcon className="w-10 h-10 md:w-16 md:h-16 self-start shrink-0" />
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
          <span className="text-[0.07em] text-right md:text-xs text-slate-400">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: false, locale: es })}
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
            className={cn('mt-2 text-xs bg-slate-100', { 'bg-cyan-500/30': aportando })}
            placeholder="Introduce tu respuesta"
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
