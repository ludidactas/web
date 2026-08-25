import ReactMarkdown, { type Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'

// Definidos a nivel de módulo: si se recrean en cada render, react-markdown remonta el árbol
// y las imágenes se vuelven a cargar en cada tecla.
const remarkPlugins = [remarkMath]
// `detect` adivina el lenguaje cuando el bloque no lo declara; sin esto un ``` pelado no se colorea.
const rehypePlugins: PluggableList = [
  [rehypeKatex, { output: 'mathml' }],
  [rehypeHighlight, { detect: true }],
]

const components: Components = {
  p: ({ node: _node, ...props }) => <span {...props} className="block" />,
  img: ({ node: _node, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt ?? ''} loading="lazy" className="block mx-auto max-w-full max-h-64 rounded-lg my-2" />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      {...props}
      className="block text-left whitespace-pre-wrap break-words overflow-x-auto rounded-lg p-2 my-2 text-xs"
    />
  ),
}

const PATRONES_MARKDOWN = [
  /!\[[^\]]*\]\([^)]*\)/, // imagen
  /\[[^\]]+\]\([^)]*\)/, // link
  /```/, // code block
  /`[^`\n]+`/, // código inline
  /\$[^$\n]+\$/, // fórmula
  /\*\*[^\s*][^*]*\*\*/, // negrita
  /(?:^|\s)\*[^\s*][^*\n]*\*/, // cursiva
  /(?:^|\s)_[^\s_][^_\n]*_/, // cursiva
  /^#{1,6}\s/m, // título
  /^\s*[-+*]\s+/m, // lista
  /^\s*\d+\.\s+/m, // lista numerada
  /^\s*>\s/m, // cita
]

/** True si el texto tiene algún patrón que markdown renderizaría distinto al texto plano. */
export const necesitaMarkdown = (texto: string) => PATRONES_MARKDOWN.some((patron) => patron.test(texto))

/**
 * Renderiza el texto de una pregunta: imágenes por URL, fórmulas (`$inline$` / `$$bloque$$`)
 * y code blocks con syntax highlighting. El HTML embebido se muestra literal, no se interpreta.
 *
 * Si el texto no tiene ningún patrón de markdown, se devuelve tal cual sin pasar por el parser.
 */
export function PreguntaMarkdown({ texto }: { texto: string }) {
  if (!necesitaMarkdown(texto)) return <>{texto}</>

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {texto}
    </ReactMarkdown>
  )
}
