declare module '*.mdx' {
  import type { ComponentType } from 'react'

  // The default export is the MDX component
  const Component: ComponentType
  export default Component

  // Export the `meta` frontmatter explicitly
  export const meta: Record<string, object>
}
