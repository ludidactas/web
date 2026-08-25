import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icon } from '@iconify/react/dist/iconify.js'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { PreguntaMarkdown } from './pregunta-markdown'

const EJEMPLOS = [
  {
    nivel: 'Básico',
    texto: 'Recordando $a^2 + b^2 = c^2$, ¿Cuánto vale el cateto que falta en la siguiente expresión?',
  },
  {
    nivel: 'Intermedio',
    texto:
      'La fórmula $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ nos permite calcular raíces de funciones cuadráticas',
  },
  { nivel: 'Avanzado', texto: 'La función gamma se describe como $$\\Gamma(z) = \\int_0^\\infty t^{z-1}e^{-t}dt\\,$$' },
]

/** Dialog de referencia rápida para escribir fórmulas con KaTeX en la descripción de una pregunta. */
export function GuiaFormulasDialog({ children }: PropsWithChildren) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col gap-4 max-w-md max-h-[85vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4">
          <Icon className="w-5 h-5 text-ld-violeta" icon="material-symbols:close-rounded" />
        </DialogClose>
        <DialogTitle className="text-ld-violeta text-xl font-bold">Fórmulas con KaTeX</DialogTitle>

        <p className="text-sm text-slate-600">
          Escribí fórmulas en LaTeX entre signos <code>$..$</code> o <code>$$..$$</code>. Algunos ejemplos:
        </p>

        <div className="flex flex-col gap-3">
          {EJEMPLOS.map(({ nivel, texto }) => (
            <div key={nivel} className="flex flex-col gap-1 rounded-lg border border-ld-violeta/20 p-3">
              <p className="text-xs font-semibold text-ld-violeta/70">{nivel}</p>
              <code className="text-xs text-slate-500 break-all">{texto}</code>
              <div className="text-sm text-center py-1">
                <PreguntaMarkdown texto={texto} />
              </div>
            </div>
          ))}
        </div>

        <Link
          href="https://proyectodescartes.org/escenas-aux/CurspLibrosDescartesHerramientasIA/recursos1/manual_katex.html"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm text-ld-violeta underline"
        >
          Ver referencia de KaTeX en español
        </Link>

        <Link
          href="https://katex.org/docs/supported.html"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm text-ld-violeta underline"
        >
          Ver referencia oficial en inglés
        </Link>
      </DialogContent>
    </Dialog>
  )
}
