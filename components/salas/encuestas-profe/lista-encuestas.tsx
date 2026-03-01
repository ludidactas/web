// import { LdSvg } from "@/components/custom/ld-svg"
import useClipboard from '@/components/hooks/use-clipboard'
import { StatusDeConexion, statusesDeCarga } from '@/components/hooks/use-conexion-wss'
import { ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import profeUps from '@/svg/ProfeUpsSVGO.svg'
import { Encuesta } from '@/wss/tipos'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Copy, Eye, EyeOff, MessageCircleQuestionIcon, SquareCheckBig } from 'lucide-react'
import { Acciones } from './acciones'
import { useEncuestaProfe } from './encuestas-profe-context'
import useConfirmarConDelay from '@/components/hooks/use-delay'
import { Icon as Iconito } from '@iconify/react'
import { useState } from 'react'
import { LdSvg } from '@/components/custom/ld-svg'
import { Accordion, AccordionContent } from '@/components/ui/accordion'
import { AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'

export function ListaEncuestas() {
  const { encuestas, estado } = useEncuestaProfe()

  const { valor: posibleVacio, confirmado: confirmadoVacio } = useConfirmarConDelay(
    () => estado === StatusDeConexion.Conectado && encuestas.length === 0,
    1000
  )

  const conectando = statusesDeCarga.includes(estado)

  if (conectando || (posibleVacio && !confirmadoVacio)) {
    return <div className="h-full flex items-center justify-center">Cargando encuestas...</div>
  }

  if (confirmadoVacio && posibleVacio)
    return (
      <div className="flex flex-col justify-center items-center grayscale">
        <p className="text-center text-slate-500 text-xl m-4"> ¡Aún no haz hecho ninguna pregunta!</p>
        <LdSvg className="w-3/4" SvgComponent={profeUps} />
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
    <div className="p-2 mx-4  mb-2 rounded-3xl">
      {/* Pregunta desplegable */}
      <Accordion type="single" collapsible className="flex flex-col  justify-center">
        <AccordionItem value={'item-1'}>
          <AccordionTrigger
            className={cn(
              'flex w-full gap-4',
              'bg-[#00B0D2]/10 text-[#00B0D2] border-4 border-[#00B0D2]/30',
              'rounded-2xl px-4 md:px-8 justify-between items-center cursor-pointer ',
              'hover:bg-[#00B0D2]/20 transition-colors'
            )}
          >
            <div className="flex gap-2 items-center">
              <MessageCircleQuestionIcon className="col-start-1 col-end-2 w-6 h-6 md:w-10 md:h-10 shrink-0" />
              <h3 className="text-xs md:text-base text-left break-words font-bold">{encuesta.pregunta}</h3>
            </div>
            <div className="flex items-center gap-4">
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
                <span className="text-[0.6rem]  text-slate-400 text-right">
                  {formatDistanceToNow(new Date(encuesta.createdAt), { addSuffix: true, locale: es })}
                </span>

                {/* Botón de copiar */}
                <div className="flex items-center justify-end mb-2">
                  <p
                    title="Copiar pregunta"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(
                        encuesta.pregunta + '\n' + opcionesInfo + '\n' + 'Total participantes: ' + totalVotos
                      )()
                    }}
                  >
                    {justCopied ? (
                      <SquareCheckBig absoluteStrokeWidth className="text-emerald-700" />
                    ) : (
                      <Copy absoluteStrokeWidth />
                    )}
                  </p>
                </div>
              </div>

              {/* Icono de despliegue */}
            </div>
          </AccordionTrigger>

          {/* Contenido desplegado */}
          <AccordionContent>
            <div className="mt-4">
              {encuesta.admiteAportes && (
                <p className="text-xs list-none text-center p-4 text-emerald-500">
                  Los estudiantes pueden agregar opciones
                </p>
              )}

              {/* Opciones */}
              <ol className="list-[lower-latin] text-xs md:text-xl font-bold rounded-xl border-4 border-[#00B0D2]/20 text-[#00B0D2]/80 py-4 px-8 flex flex-col justify-center gap-4 w-full">
                <div className="flex justify-end">
                  {encuesta.isRevealed && <Eye size={30} className="text-cyan-500 " />}{' '}
                  {!encuesta.isRevealed && <EyeOff size={30} className="text-slate-500 " />}
                </div>
                {encuesta.opciones.map((opcion) => (
                  <li key={opcion.id}>
                    <div className="flex border-b-2 border-dashed justify-between pt-2 gap-4">
                      <p className="w-64">{opcion.texto}</p>
                      <div className="w-24 flex items-center justify-end gap-2">
                        <p
                          className={` font-bold  content-center ${
                            encuesta.isRevealed ? 'text-cyan-500' : 'text-gray-500'
                          }`}
                        >
                          {' '}
                          {opcion.votos}
                        </p>
                        <Iconito
                          className={`h-8 w-8 ${encuesta.isRevealed ? 'text-cyan-500' : 'text-gray-500'}`}
                          icon={'streamline-freehand:camera-settings-hand-motion'}
                        />
                      </div>
                    </div>
                  </li>
                ))}

                {/* Total participantes */}
                <div className="flex mt-2 text-md mx-16 text-[#00B0D2] border-[#00B0D2] font-bold text-center justify-between gap-4 border-b-2 border-dotted">
                  <p> Total Participantes </p>
                  <p>{totalVotos}</p>{' '}
                </div>
              </ol>

              <Acciones encuesta={encuesta} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
