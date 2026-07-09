'use client'
import { Link } from 'react-scroll'
import ArrowDownNew from '@/svg/dist/ui/nuevoDown.svg'
import { LdSvg } from './ld-svg'

interface ArrowDownLdProps {
  to: string
}
export default function ArrowDownLd({ to }: ArrowDownLdProps) {
  return (
    <div className="w-10 lg:w-16 hover:scale-125">
      <Link className='' to={to} smooth={true} duration={500}>
        <LdSvg
          className="md:animate-[bounce_0.8s_infinite]"
          SvgComponent={ArrowDownNew} />
      </Link>
    </div>
  )
}
