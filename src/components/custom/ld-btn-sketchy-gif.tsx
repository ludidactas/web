import Link from 'next/link'
import { ComponentProps } from 'react'
import { body } from '../fonts'
import { cn } from '@/lib/utils'

interface BtnSketchyGifProps extends ComponentProps<typeof Link> {
  disabled?: boolean
  texto?: string
}

/** Btn sketchy usando gifs */
export default function BtnSketchyGif({ disabled, texto, ...props }: BtnSketchyGifProps) {
  return (
    <Link
      {...props}
      className={cn(
        'w-fit py-2 px-8 flex-0 md:scale-1.15 bg-center bg-no-repeat bg-contain hover:text-shadow-md',
        body.className,
        {
          'bg-[url(/img/btndisabled.webp)] text-slate-600 cursor-arrow pointer-events-none': disabled,
          'bg-[url(/img/btnhover.gif)]': !disabled,
        },
        props.className
      )}
    >
      {' '}
      {props.children || texto}
    </Link>
  )
}
