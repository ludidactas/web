'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import { oscilar } from '@/lib/utils'
import SvgEscritorio from '@/svg/dist/identidad/escritorio.svg'

export default function Escritorio() {
  return (
    <LdSvg
      SvgComponent={SvgEscritorio}
      ids={['personaje', 'items', 'bg']}
      animation={oscilar(['items', 'bg', 'personaje'], 0.5, 0.12, 1)}
    />
  )
}
