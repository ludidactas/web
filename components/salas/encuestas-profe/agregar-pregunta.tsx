import { pollBase } from "@/wss/validators/polls"
import { Checkbox } from "@radix-ui/react-checkbox"
import { X, CirclePlus, Send } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useEncuestaProfe } from "./encuestas-profe-context"

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
    enviarPregunta(pregunta, opciones, admiteAportes === 'indeterminate' ? false : admiteAportes)
      .then(() => {
        toast.success(`Encuesta creada!`)
        setPregunta('')
        setOpciones(['', ''])
      })
      .catch((msg) => toast.error(msg))
  }


  return (
    <div className="flex flex-col mx-2 rounded-xl bg-indigo-50 p-4 gap-2">
      <p className="text-xl">Pregunta:</p>
      <textarea
        className="border-b w-full p-2 resize-none"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        tabIndex={1}
      />

      {opciones.map((respuesta, index) => (
        <div key={index} className="flex gap-4 items-center">
          <span className="whitespace-nowrap">Opc. {index + 1}</span>
          <input
            className="border-b w-full p-1"
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

      {/* Checkbox estudiantes pueden agregar respuestas */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Checkbox className='bg-white' checked={admiteAportes} onCheckedChange={setAdmiteAportes} title="" />
        <p className="text-indigo-500">Los estudiantes pueden agregar sus propias opciones</p>
      </div>

      {error && (
        <p className="flex text-rose-500 md:w-96 self-center text-center text-xs">(La pregunta debe tener al menos dos opciones o permitir que los estudiantes puedan agregarlas)</p>
      )}

      {/* Boton agregar respuesta */}
      <button
        className=" flex place-content-center items-center font-semibold gap-2 bg-indigo-500/90 text-white px-2 md:px-4 py-2 rounded"
        onClick={agregarRespuesta}
        tabIndex={opciones.length + 2}
      >
        <CirclePlus size={20} />
        Agregar opción
      </button>
      {/* Boton postear pregunta */}

      <button
        disabled={!success}
        className='flex place-content-center items-center font-semibold gap-2 bg-emerald-500 text-white px-2 md:px-4 py-2 rounded disabled:bg-slate-300 disabled:text-slate-500'
        onClick={postearPregunta}
        tabIndex={opciones.length + 2}
      >
        <Send size={20} /> Enviar pregunta
      </button>
    </div>
  )
}

