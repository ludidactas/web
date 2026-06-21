import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export const meta = {
  title: 'some meta',
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // Peeero nosotres los estileamos desde `md.css` (borrado, re-crear llegado el momento).
    // Dejemos esto solo para customizar el nivel funcional.
    img: (props) => <Image width={1000} height={1000} {...(props as ImageProps)} />,
    ...components,
  }
}
