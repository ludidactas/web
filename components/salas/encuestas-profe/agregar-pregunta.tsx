import { Checkbox } from '@/components/ui/checkbox'
import { pollBase } from '@/wss/validators/polls'
import { CirclePlus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { Icon } from '@iconify/react/dist/iconify.js'

export function AgregarPregunta() {
  const { crear } = useConexionProfe()

  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState<string[]>(['', ''])
  const [admiteAportes, setAdmiteAportes] = useState<boolean | 'indeterminate'>(false)

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

  const { success, error } = pollBase.safeParse({ pregunta, opciones, admiteAportes })

  const postearPregunta = () => {
    crear(pregunta, opciones, admiteAportes === 'indeterminate' ? false : admiteAportes)
      .then(() => {
        toast.success(`Encuesta creada!`)
        setPregunta('')
        setOpciones(['', ''])
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
              <Icon icon={'lucide:trash-2'}/>
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
            <p className="flex text-rose-500 md:w-96 self-center text-center text-xs">
              (La pregunta debe tener al menos dos opciones o permitir que los estudiantes puedan agregarlas)
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}
