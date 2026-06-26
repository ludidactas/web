import { cn } from '@/lib/utils'
import NextLink from 'next/link'
import { ComponentProps } from 'react'

export const LinkGradiente = (props: ComponentProps<typeof NextLink>) => (
  <NextLink
    {...props}
    className={cn(
      `bg-gradient-to-r from-cyan-500 to-violet-500 
    text-transparent bg-clip-text
    hover:underline border-violet-500 font-bold`,
      props.className
    )}
  />
)
