import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

/** Estilo común a los botones de login/logout */
export function BtnAuth({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'text-lg w-fit h-fit p-2 border-4 hover:border-dashed rounded-2xl hover:transform hover:rotate-3  text-teal-600 border-teal-600',
        className
      )}
      {...props}
    />
  )
}
