import { Checkbox } from '@/components/ui/checkbox'
import { NumberInput } from '@/components/ui/number-input'
import { pollBase } from '@/wss/validators/polls'
import { CirclePlus, Infinity, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { extractZodErrorMessages } from '@/wss/utils'

export function AgregarPregunta() {
  const { crear } = useConexionProfe()

  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState<string[]>(['', ''])
  const [admiteAportes, setAdmiteAportes] = useState<boolean | 'indeterminate'>(false)
  const [admiteMultiplesVotos, setAdmiteMultiplesVotos] = useState<boolean | 'indeterminate'>(false)
  const [maxMultiplesVotos, setMaxMultiplesVotos] = useState<number | null>(null)
  // const [crearSinPublicar, setCrearSinPublicar] = useState<boolean | 'indeterminate'>(false)

  const agregarRespuesta = () => {
    setOpciones((rs) => [...rs, ''])
  }

  const actualizarRespuesta = (index: number, valor: string) => {
    setOpciones((respuestas) => {
      const nuevas = [...respuestas]
      nuevas[index] = valor
      return nuevas
    })
  }

  const eliminarRespuesta = (index: number) => {
    setOpciones((respuestas) => respuestas.filter((_, i) => i !== index))
  }

  // Nos fijamos si la pregunta es valida para habilitar o no el boton de postear pregunta, y para mostrar un tooltip con el error
  const {
    data: encuesta,
    success,
    error,
  } = pollBase.safeParse({ pregunta, opciones, admiteAportes, admiteMultiplesVotos, maxMultiplesVotos })

  const postearPregunta = () => {
    if (!success) return
    crear(encuesta)
      .then(() => {
        toast.success(`Encuesta creada!`)
        setPregunta('')
        setOpciones(['', ''])
        setAdmiteAportes(false)
        setAdmiteMultiplesVotos(false)
        setMaxMultiplesVotos(null)
      })
      .catch((msg) => toast.error(msg))
  }

  return (
    <div className="flex flex-col mx-2 rounded-xl bg-[#f2ebff] p-8 gap-2 md:min-w-[450px]">
      <p className="text-2xl  text-[#8345FE]  font-bold">Pregunta:</p>
      <textarea
        className="w-full p-2 resize-none rounded"
        placeholder="Haz tu pregunta..."
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        tabIndex={1}
      />

      <p className="text-2xl mt-4 text-[#8345FE]  font-bold">Opciones:</p>

      {opciones.length === 0 && <p className="text-gray-400">No hay opciones</p>}

      {opciones.length > 0 &&
        opciones.map((respuesta, index) => (
          <div key={index} className="flex gap-4 items-center ml-4">
            <span className="whitespace-nowrap text-[#8345FE] font-bold">{String.fromCharCode(97 + index)}.</span>
            <input
              className="rounded w-full p-1"
              type="text"
              value={respuesta}
              onChange={(e) => actualizarRespuesta(index, e.target.value)}
              tabIndex={index + 2}
            />

            <button
              className="flex items-center text-rose-700  transition-all duration-100"
              onClick={() => eliminarRespuesta(index)}
              tabIndex={-1}
            >
              <Trash2 />
            </button>
          </div>
        ))}
      {/* Boton agregar respuesta */}
      <button
        className="flex items-center self-center w-fit font-semibold gap-2  text-white px-2 py-2 rounded-full"
        onClick={agregarRespuesta}
        tabIndex={opciones.length + 2}
      >
        <CirclePlus className="text-[#8345FE] font-bold hover:scale-105" size={30} />
      </button>

      {/* Checkbox estudiantes pueden agregar respuestas */}
      <div className="flex items-center gap-2 px-4">
        <Checkbox className="bg-white" checked={admiteAportes} onCheckedChange={setAdmiteAportes} title="" />
        <p className="text-indigo-500 text-sm">Los estudiantes pueden agregar sus propias opciones</p>
      </div>

      {/* Checkbox e input de multirespuestas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-4">
          <Checkbox
            className="bg-white"
            checked={admiteMultiplesVotos}
            onCheckedChange={setAdmiteMultiplesVotos}
            title=""
          />
          <p className="text-indigo-500 text-sm">Multiple choice</p>
        </div>

        {/* Cuántas? */}
        <div className={cn('flex items-center gap-2 px-4 pl-9', !admiteMultiplesVotos && 'invisible')}>
          <p className="text-indigo-500 text-xs">Máx. respuestas:</p>{' '}
          <NumberInput
            className="text-xs"
            max={admiteAportes ? 99 : opciones.length}
            value={maxMultiplesVotos}
            onChange={setMaxMultiplesVotos}
            nullDisplay={
              admiteAportes ? (
                <Infinity size={14} className="mx-auto text-indigo-400" />
              ) : (
                <span className="text-indigo-400">{opciones.length}</span>
              )
            }
          />
        </div>
      </div>

      {/* Checkbox no publicar de inmediato */}
      {/* <div className="flex items-center gap-2 px-4">
        <Checkbox className="bg-white" checked={} onCheckedChange={} title="" />
        <p className="text-indigo-500 text-sm">Crear sin publicar de inmediato</p>
      </div> */}

      {/* Boton postear pregunta */}
      <Tooltip disableHoverableContent={!error}>
        <TooltipTrigger asChild>
          <button
            disabled={!success}
            className="flex place-content-center mt-4 items-center font-semibold gap-2 rounded-full text-white px-2 md:px-4 py-2 bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500"
            onClick={postearPregunta}
            tabIndex={opciones.length + 2}
          >
            <Send size={20} /> Enviar pregunta
          </button>
        </TooltipTrigger>
        {error && (
          <TooltipContent>
            <p className="flex text-rose-500 md:max-w-96 self-center text-center text-xs">
              ({extractZodErrorMessages(error)})
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}
