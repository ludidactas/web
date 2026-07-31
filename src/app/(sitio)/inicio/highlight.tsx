import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

interface HlProps extends PropsWithChildren {
  className?: string
}

export const Hl = ({ className, children }: HlProps) => (
  <span className={cn('text-ld-azul font-bold', className)}>{children}</span>
)
