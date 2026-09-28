'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Tab con el mismo aspecto que un `TabsTrigger`, pero que en vez de cambiar el contenido local
 * navega a otra ruta. Se usa para las pestañas de Encuestas/Go en la vista mobile del profe, que son
 * páginas separadas en vez de contenido dentro del mismo `Tabs`. */
export function TabsTriggerLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:text-white',
        className
      )}
    >
      {children}
    </Link>
  )
}
