'use client'

import { ComponentProps, ReactNode } from 'react'
import { NavLink } from './nav-link'
import { cn } from '@/lib/utils'

type NavLinkPulsoProps = Omit<ComponentProps<typeof NavLink>, 'children'> & { children: ReactNode }


// NavLink con feedback de pulso inline mientras navega, listo para usar desde Server Components (que no pueden pasarle a NavLink una función como children).
 
export function NavLinkPulso({ children, ...rest }: NavLinkPulsoProps) {
  return (
    <NavLink {...rest}>
      {(isPending) => <span className={cn(isPending && 'animate-pulse duration-300')}>{children}</span>}
    </NavLink>
  )
}
