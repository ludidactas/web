import NextLink from 'next/link'
import { ComponentProps } from 'react'

export const LinkGradiente = (props: ComponentProps<typeof NextLink>) => (
  <NextLink
    className="bg-gradient-to-r from-cyan-500 to-violet-500 
    text-transparent bg-clip-text underline decoration-double 
    hover:border-b border-violet-500"
    {...props}
  />
)
