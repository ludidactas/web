import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NumberInput } from '@/components/ui/number-input'
import { crearEncuesta } from '@/wss/validators/polls'
import { CirclePlus, Infinity, Send } from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { extractZodErrorMessages } from '@/wss/utils'
import { Icon } from '@iconify/react/dist/iconify.js'

export function AgregarPregunta() {
  const { crear } = useConexionProfe()

  const [open, setOpen] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState<string[]>(['', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [admiteAportes, setAdmiteAportes] = useState<boolean | 'indeterminate'>(false)
  const [admiteMultiplesVotos, setAdmiteMultiplesVotos] = useState<boolean | 'indeterminate'>(false)
  const [maxMultiplesVotos, setMaxMultiplesVotos] = useState<number | null>(null)
  // const [crearSinPublicar, setCrearSinPublicar] = useState<boolean | 'indeterminate'>(false)

  const agregarRespuesta = () => {
    setOpciones((rs) => {
      const nuevas = [...rs, '']
      setTimeout(() => inputRefs.current[nuevas.length - 1]?.focus(), 0)
      return nuevas
    })
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
  } = crearEncuesta.safeParse({
    pregunta,
    opciones,
    admiteAportes,
    admiteMultiplesVotos,
    maxMultiplesVotos,
    isOpen: true,
    isPublished: true,
  })

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
        setOpen(false)
      })
      .catch((msg) => toast.error(msg))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
        <DialogTrigger asChild>
          <button className="group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-ld-azul hover:bg-ld-azul/80 transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base">
            <CirclePlus className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[180px] md:transition-all md:duration-300 md:ease-in-out">
              Agregar pregunta
            </span>
          </button>
        </DialogTrigger>
      </div>

      <DialogContent className="flex flex-col w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-xl bg-[#f2ebff] p-2 sm:p-8 gap-2 sm:max-w-lg md:max-w-xl">
        <DialogClose className="absolute right-4 top-4">
          <Icon className="w-6 h-6 text-ld-violeta" icon={'material-symbols:close-rounded'} />
        </DialogClose>
        <DialogTitle className="text-ld-violeta text-center text-xl md:text-3xl">Agregar pregunta</DialogTitle>

        {/* Pregunta */}
        <div>
          <p className="text-lg md:text-2xl  text-ld-violeta py-2 font-bold">Pregunta:</p>
          <textarea
            className="w-full p-2 resize-none rounded"
            placeholder="Haz tu pregunta..."
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            tabIndex={1}
          />
        </div>

        {/* Opciones */}
        <p className="text-lg md:text-2xl  mt-4 text-ld-violeta  font-bold">Opciones:</p>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {opciones.length === 0 && <p className="text-gray-400">No hay opciones</p>}

          {opciones.length > 0 &&
            opciones.map((respuesta, index) => (
              <div key={index} className="flex gap-2 items-center ml-4">
                <span className="whitespace-nowrap text-ld-violeta font-bold">{String.fromCharCode(97 + index)}.</span>
                <input
                  className="rounded w-full p-1"
                  type="text"
                  value={respuesta}
                  onChange={(e) => actualizarRespuesta(index, e.target.value)}
                  tabIndex={index + 2}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                />

                <button
                  className="flex items-center text-rose-700  transition-all duration-100"
                  onClick={() => eliminarRespuesta(index)}
                  tabIndex={-1}
                >
                  <Icon icon={'lucide:trash-2'} />
                </button>
              </div>
            ))}
        </div>

        {/* Boton agregar opcion */}
        <button
          className="flex items-center self-center w-fit font-semibold gap-2  text-white px-2 py-2 rounded-full"
          onClick={agregarRespuesta}
          tabIndex={opciones.length + 2}
        >
          <CirclePlus className="text-ld-violeta font-bold hover:scale-105" size={30} />
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
            <p className="text-indigo-500 text-sm w-max">Multiple choice</p>
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
      </DialogContent>
    </Dialog>
  )
}
