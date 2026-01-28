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
// import Polls from '/svg/pollsvgo.svg'
import { oscilar } from '@/lib/animaciones'
import { EncuestaHidratada } from '@/wss/tipos'
import { MessageCircleQuestionIcon, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'
import LoadingSalaEstudiante from '@/app/(herramientas)/sala/[idSala]/loading'
import useConfirmarConDelay from '@/components/hooks/use-delay'
import { useEncuestaEstudianteLogin } from './encuestas-estudiante-login-context'
import IconEnc from '@/svg/EncuestaIconSVGO.svg'
import Conectado from '@/svg/ConectadoSVGO.svg'

export default function EncuestasEstudiante({ idSala }: { idSala: string }) {
  const { estado, encuestas, error, WssDebugPanel } = useEncuestaEstudiante()
  const { configSala } = useEncuestaEstudianteLogin()
  const { valor: posibleVacio, confirmado: confirmadoVacio } = useConfirmarConDelay(
    () => StatusDeConexion.Conectado && encuestas.length === 0,
    1000
  )
  const encuestasVisibles = encuestas.filter((e) => e.isPublished)
  const conectando = [
    StatusDeConexion.Autenticando,
    StatusDeConexion.Quieto,
    StatusDeConexion.Conectando,
    StatusDeConexion.CargandoDependencias,
  ].includes(estado)

  if (conectando || (posibleVacio && !confirmadoVacio)) return <LoadingSalaEstudiante overlay />

  return (
    <div>
      {/* Header */}
      {/* <div className='flex justify-between items-center mx-2'>
      <LdSvg className="w-16 md:w-[600px]"
        SvgComponent={EncuestasIcon}
      />

      {estado === StatusDeConexion.Conectado ? (
        <span className="text-emerald-500 font-bold animate-pulse text-xs md:text-xl">
          <LdSvg className="w-16 md:w-[150px]" SvgComponent={Conectado} />
        </span>
      ) : (
        <span className="text-red-700 text-xs md:text-xl">Desconectado</span>
      )}
    </div> */}

      <div className="flex flex-col px-20 md:mx-20  gap-4">
        {process.env.NODE_ENV === 'development' && <WssDebugPanel />}
        <div className="flex px-4 items-center justify-center gap-20 bg-white rounded-3xl  ">
          <LdSvg
            className="w-[100px] md:w-[200px]"
            SvgComponent={Cabeza}
            ids={['cabeza'] as const}
            animation={oscilar(['cabeza'], 2, 1, 0.4)}
          />

          <div className="flex flex-col text-center text-3xl">
            <p className="flex gap-2 items-center">
              {' '}
              Estás en la
              <span className="flex items-center gap-2 text-4xl text-[#8345FE] rounded-full px-4  bg-[#8345FE]/5">
                {' '}
                Sala de Encuestas
                <LdSvg className="w-20" SvgComponent={IconEnc} />
              </span>
              de
            </p>
            <p className="text-teal-500"> {configSala?.nombre_profe ?? idSala}</p>
            <p className="text-2xl p-4">¡Participa respondiendo a las preguntas en vivo!</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:mx-10 ">
          {encuestasVisibles.length > 0 && (
            <>
              {encuestasVisibles.map((e) => (
                <DisplayEncuesta key={e.id} encuesta={e} />
              ))}
            </>
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
  const { votar } = useEncuestaEstudiante()
  const [seleccion, setSeleccion] = useState<EncuestaHidratada['opciones'][number]['id'] | undefined>(
    encuesta.votoEmitido
  )
  const [yaVotado, setYaVotado] = useState(!encuesta.puedoVotar)

  const [aportando, setAportando] = useState(false)
  const [aporte, setAporte] = useState('')

  return (
    <div className="flex flex-col gap-4 mt-6 md:p-8 bg-indigo-50/90 shadow-indigo-200 rounded-xl">
      {/* Titulo y opciones */}
      <div className="flex md:gap-6 items-center justify-between rounded-xl">
        <div
          className={`flex items-start md:items-center text-indigo-500  gap-2 md:gap-4 ${yaVotado ? 'grayscale' : ''}`}
        >
          <MessageCircleQuestionIcon size={60} className="self-start" />
          {/* <LdSvg className='w-[10%]' SvgComponent={Polls}/> */}
          {/* <Image className='md:w-10 md:h-10' src={'/img/iconpoll.png'} height={30} width={30} alt='' /> */}
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
          <span className="text-[0.1em] md:text-xs text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
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
            className={cn('mt-2', { 'bg-cyan-500/30': aportando })}
            placeholder="Otra opción"
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
