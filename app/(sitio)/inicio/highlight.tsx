import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

interface HlProps extends PropsWithChildren {
  className?: string
}

export const Hl = ({ className, children }: HlProps) => (
  <span className={cn('text-[#46BFD7] font-bold', className)}>{children}</span>
)
