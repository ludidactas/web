import { LdSvg } from "@/components/custom/ld-svg"
import useClipboard from "@/components/hooks/use-clipboard"
import { StatusDeConexion } from "@/components/hooks/use-conexion-wss"
import { ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Dedito from '@/public/img/icons8-one-finger-32.png'
import profeUps from '@/svg/ProfeUpsSVGO.svg'
import { Encuesta } from "@/wss/tipos"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Copy, Eye, EyeOff, MessageCircleQuestionIcon, SquareCheckBig } from "lucide-react"
import Image from 'next/image'
import { useEffect, useState } from "react"
import { Acciones } from "./acciones"
import { useEncuestaProfe } from "./encuestas-profe-context"
import useConfirmarConDelay from "@/components/hooks/use-delay"


export function ListaEncuestas() {
  const { encuestas, estado } = useEncuestaProfe()

  const { valor: posibleVacio, confirmado: confirmadoVacio}  = useConfirmarConDelay( () => estado === StatusDeConexion.Conectado && encuestas.length === 0, 1000)

  const conectando = [StatusDeConexion.Quieto, StatusDeConexion.Conectando, StatusDeConexion.Autenticando, StatusDeConexion.CargandoDependencias].includes(estado)

  if (conectando || (posibleVacio && !confirmadoVacio)) {
    return <div className="h-full flex items-center justify-center">Cargando encuestas...</div>
  }

  if (confirmadoVacio && posibleVacio)
    return (
      <div>
        <p className="text-center m-4"> ¡Aún no haz hecho ninguna pregunta!</p>
        <LdSvg className="grayscale" SvgComponent={profeUps} />
      </div>
    )

  return (
    <ScrollArea className="h-[500px] overflow-y-auto" scrollHideDelay={1000}>
      {encuestas.map((e) => (
        <DisplayEncuesta key={e.id} encuesta={e} />
      ))}
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}

function DisplayEncuesta({ encuesta }: { encuesta: Encuesta }) {
  const { justCopied, handleCopy } = useClipboard()

  const opcionesInfo = encuesta.opciones.map((opcion) => '\n' + opcion.texto + ' -' + ' ' + opcion.votos + ' votos')
  const totalVotos = encuesta.opciones.reduce((total, opcion) => total + opcion.votos, 0)
  const estado = encuesta.isFocused ? 'Enfocada' : encuesta.isOpen ? 'Abierta' : 'Cerrada'

  return (
    <div className="p-4 mx-4 rounded-xl border-4 border-[#00B0D2]/30">
      {/* Titulo y status */}
      <div className="flex flex-col sm:flex-row md:gap-4 bg-[#00B0D2]/10 text-[#00B0D2] rounded-xl p-2 md:p-4 justify-between sm:items-center">
        <div className="flex gap-2 items-center">
          <MessageCircleQuestionIcon size={10} className="shrink-0 col-start-1 col-end-2 w-10 h-10" />
          <h3 className="text-sm break-words font-bold  md:text-xl">{encuesta.pregunta}</h3>
        </div>
        <div className="flex flex-col md:gap-1 items-end">
          <span
            className={cn('text-sm', {
              'text-emerald-700 animate-pulse duration-1000': estado === 'Abierta',
              'text-rose-800': estado === 'Cerrada',
              'text-violet-500 font-bold animate-pulse duration-500': estado === 'Enfocada',
            })}
          >
            {estado}
          </span>
          <span className="text-[0.6rem] whitespace-nowrap text-slate-400 text-right">
            {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
          </span>

          {/* Botones de arriba a la derecha */}
          <div className='flex items-center justify-end'>
            {/* Lista de opciones y votos */}
            <div className="flex justify-end">
              {encuesta.isRevealed && <Eye absoluteStrokeWidth className="text-cyan-500 mr-6" />}{' '}
              {!encuesta.isRevealed && <EyeOff absoluteStrokeWidth className="mr-6" />}
            </div>
            <button
              className="mt-2"
              title="Copiar pregunta"
              onClick={handleCopy(
                encuesta.pregunta + '\n' + opcionesInfo + '\n' + 'Total participantes: ' + totalVotos
              )}
            >
              {justCopied ? (
                <SquareCheckBig absoluteStrokeWidth className="text-emerald-700" />
              ) : (
                <Copy absoluteStrokeWidth />
              )}
            </button>
          </div>
        </div>
      </div>

      {encuesta.admiteAportes && (
        <p className="text-xs list-none text-center text-emerald-500">Los estudiantes pueden agregar opciones</p>
      )}

      {/* Opciones */}
      <ol className="list-[lower-latin] text-xs md:text-xl font-bold rounded-xl border-4 border-[#00B0D2]/20 text-[#00B0D2]/80 py-4 pl-8 md:px-10 flex flex-col gap-4 m-2 ">
        {encuesta.opciones.map((opcion) => (
          <li key={opcion.id}>
            <div className="flex border-b-2 border-dashed justify-between pt-2 gap-4">
              <p className="w-64">{opcion.texto}</p>
              <div className="w-24 flex items-center justify-end">
                <p className={` font-bold  content-center ${encuesta.isRevealed ? 'text-cyan-500' : 'text-gray-500'}`}>
                  {' '}
                  {opcion.votos}
                </p>
                <Image className="shrink-0" src={Dedito} alt="dedito" />
              </div>
            </div>
          </li>
        ))}
        <ol>
          <li className="flex mt-2 text-md mx-16 text-[#00B0D2] rounded-xl bg-[#00B0D2]/10 font-bold text-center justify-between p-2 gap-4">
            <p> Total Participantes </p> <p>{totalVotos}</p>{' '}
          </li>
        </ol>
      </ol>

      <Acciones encuesta={encuesta} />

    </div>
  )
}
