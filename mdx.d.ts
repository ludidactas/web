declare module '*.mdx' {
  import type { ComponentType } from 'react'

  // Interfaz de el export del frontmatter
  const meta: {
    title?: string
    description?: string
    [key: string]: any
  }

  // El default export es un componente
  const MDXContent: ComponentType

  // Need to export meta this way to match remarkMdxFrontmatter
  export { meta }
  export default MDXContent
}
