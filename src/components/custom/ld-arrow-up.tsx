'use client'
import { Link } from 'react-scroll'
import { LdSvg } from './ld-svg'
import ArrowUpNew from '@/svg/dist/ui/nuevoUp.svg'

interface ArrowUpLdProps {
  to: string
  classname?: string
}
export default function ArrowUpLd({ to, classname }: ArrowUpLdProps) {
  return (
    <div className={`w-11 lg:w-20 mt-10 hover:scale-125 ${classname}`}>
      <Link to={to} smooth={true} duration={500}>
        <LdSvg SvgComponent={ArrowUpNew}
          className="md:animate-[bounce_0.8s_infinite]"
        />
      </Link>
    </div>
  )
}
