import Link from 'next/link'
import { ComponentProps } from 'react'
import { body } from '../fonts'
import { LdSvg } from './ld-svg'
import BotonSvg from '@/svg/dist/boton-2.svg'
import { secuenciar } from '@/lib/utils'

export default function BtnSketchySvg(props: ComponentProps<typeof Link> & { disabled?: boolean }) {
  return (
    <Link
      {...props}
      className={`w-fit h-fit flex-0 md:scale-1.15 ${body.className} ${props.className}`}
    >
      <LdSvg 
        className='w-full h-full' 
        SvgComponent={BotonSvg}
        ids={['btnuno', 'btndos', 'btntres', 'slot'] as const}
        slots={{ slot: props.children } as const}
        animation={secuenciar(['btnuno', 'btndos', 'btntres'], 600)}
      />
    </Link>
  )
}
