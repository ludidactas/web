import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icon } from '@iconify/react/dist/iconify.js'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { PreguntaMarkdown } from './pregunta-markdown'

const EJEMPLOS = [
  { etiqueta: 'Negrita / cursiva', texto: '**negrita** y _cursiva_' },
  {
    etiqueta: 'Imagen',
    texto:
      '![Cabildo en la revolución de Mayo](https://upload.wikimedia.org/wikipedia/commons/5/53/25_de_mayo_por_F._Fortuny.jpg)',
  },
  {
    etiqueta: 'Código (JavaScript)',
    texto: '```js\nfunction areaCirculo(radio) {\n  return Math.PI * radio ** 2\n}\n```',
  },
  { etiqueta: 'Código (Python)', texto: '```python\ndef area_circulo(radio):\n    return 3.1416 * radio ** 2\n```' },
]

/** Dialog de referencia rápida sobre markdown, con énfasis en que las imágenes van por URL pública. */
export function GuiaMarkdownDialog({ children }: PropsWithChildren) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col gap-4 max-w-md max-h-[85vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4">
          <Icon className="w-5 h-5 text-ld-violeta" icon="material-symbols:close-rounded" />
        </DialogClose>
        <DialogTitle className="text-ld-violeta text-xl font-bold">Markdown</DialogTitle>

        <p className="text-sm text-slate-600">
          Markdown es una forma simple de darle formato al texto: negrita, cursiva, bloques de código e imágenes.
        </p>

        <div className="flex flex-col gap-3">
          {EJEMPLOS.map(({ etiqueta, texto }) => (
            <div key={etiqueta} className="flex flex-col gap-1 rounded-lg border border-ld-violeta/20 p-3">
              <p className="text-xs font-semibold text-ld-violeta/70">{etiqueta}</p>
              <code className="text-xs text-slate-500 whitespace-pre-wrap break-words">{texto}</code>
              <div className="text-sm py-1">
                <PreguntaMarkdown texto={texto} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ld-violeta/70">
          Para incrustar una imagen necesitás que ya esté subida a algún lugar con URL pública (Google Drive, Imgur, tu
          propia web, etc.) — nosotros no alojamos imágenes.
        </p>

        <Link
          href="https://datosgobar.github.io/portal-andino/markdown-guide/"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm text-ld-violeta underline"
        >
          Ver guía completa de markdown
        </Link>
      </DialogContent>
    </Dialog>
  )
}
