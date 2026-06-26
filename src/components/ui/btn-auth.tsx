import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

/** Estilo común a los botones de login/logout */
export function BtnAuth({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'text-lg w-fit h-fit p-2 border rounded-lg border-black border-b-2 border-r-2  hover:text-teal-600 hover:border-teal-600',
        className
      )}
      {...props}
    />
  )
}
