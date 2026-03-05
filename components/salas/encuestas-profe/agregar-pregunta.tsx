import { pollBase } from '@/wss/validators/polls'
import { X, CirclePlus, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useEncuestaProfe } from './encuestas-profe-context'
import { Checkbox } from '@/components/ui/checkbox'

export function AgregarPregunta() {
  const { enviarPregunta } = useEncuestaProfe()

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
    if (opciones.length > 1) {
      setOpciones((respuestas) => respuestas.filter((_, i) => i !== index))
    }
  }

  const { success, error } = pollBase.safeParse({ pregunta, opciones, admiteAportes })

  const postearPregunta = () => {
  const opcionesFiltradas = opciones.filter((o) => o.trim() !== '')

    enviarPregunta(pregunta, opcionesFiltradas, admiteAportes === 'indeterminate' ? false : admiteAportes)
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

      {opciones.map((respuesta, index) => (
        <div key={index} className="flex gap-4 items-center ml-4">
          <span className="whitespace-nowrap text-[#8345FE] font-bold">{String.fromCharCode(97 + index)}.</span>
          <input
            className="rounded w-full p-1"
            type="text"
            value={respuesta}
            onChange={(e) => actualizarRespuesta(index, e.target.value)}
            tabIndex={index + 2}
          />
          {opciones.length > 1 && (
            <button
              className="flex items-center text-rose-600 border border-b-2 border-r-2 hover:border-b-4 hover:border-r-4 border-rose-700 p-1 rounded text-sm transition-all duration-100"
              onClick={() => eliminarRespuesta(index)}
              tabIndex={-1}
            >
              <X size={15} absoluteStrokeWidth />
            </button>
          )}
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
      <div className="flex items-center gap-1 px-4">
        <Checkbox className="bg-white" checked={admiteAportes} onCheckedChange={setAdmiteAportes} title="" />
        <p className="text-indigo-500 text-sm">Los estudiantes pueden agregar sus propias opciones</p>
      </div>

      {error && (
        <p className="flex text-rose-500 md:w-96 self-center text-center text-xs">
          (La pregunta debe tener al menos dos opciones o permitir que los estudiantes puedan agregarlas)
        </p>
      )}

      {/* Boton postear pregunta */}

      <button
        disabled={!success}
        className="flex place-content-center mt-4 items-center font-semibold gap-2 rounded-full text-white px-2 md:px-4 py-2 bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500"
        onClick={postearPregunta}
        tabIndex={opciones.length + 2}
      >
        <Send size={20} /> Enviar pregunta
      </button>
    </div>
  )
}
