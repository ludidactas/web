import { Nivel } from '@/components/hooks/libreta'

export type Niveles = Record<Nivel, Unidad[]>

type Unidad = string

export interface Meta {
  titulo?: string
  descripcion?: string
  niveles?: Niveles
  unidades?: Record<Unidad, string>
  [key: string]: any
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'

  // Interfaz de el export del frontmatter
  const meta: Meta

  // El default export es un componente
  const MDXContent: ComponentType

  // Need to export meta this way to match remarkMdxFrontmatter
  export { meta }
  export default MDXContent
}
