import Link from 'next/link'
import { ComponentProps } from 'react'
import { body } from '../fonts'
import { cn } from '@/lib/utils'

/** Btn sketchy usando gifs */
export default function BtnSketchyGif(props: ComponentProps<typeof Link> & { disabled?: boolean }) {

  const tw: Parameters<typeof cn> = [
    'w-fit py-2 px-8 flex-0 md:scale-1.15 bg-center bg-no-repeat bg-contain hover:text-shadow-md',
    body.className,
    {
      'bg-[url(/img/btndisabled.png)] text-slate-600 cursor-arrow pointer-events-none': props.disabled,
      'bg-[url(/img/btnhover.gif)]': !props.disabled,
    },
    props.className,
  ]

  return <Link {...props} className={cn(tw)}  />
}
