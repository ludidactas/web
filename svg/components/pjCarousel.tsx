'use client'
import { LdSvg } from '@/components/custom/ld-svg'
import { PropsWithChildren } from 'react'

import Biclope from '@/svg/dist/identidad/biclope.svg'
import Ojito from '@/svg/dist/identidad/ojito.svg'
import Pulpo from '@/svg/dist/identidad/pulpo.svg'
import Robot from '@/svg/dist/identidad/robot.svg'
import { oscilar } from '@/lib/animaciones'

const personajes = {
  biclope: Biclope,
  ojito: Ojito,
  pulpo: Pulpo,
  robot: Robot,
}

interface Props extends PropsWithChildren {
  personaje: keyof typeof personajes
}

export default function PjCarousel({ personaje, children }: Props) {
  return (
    <LdSvg
      SvgComponent={personajes[personaje]}
      ids={['personaje', 'items', 'bg', 'slot']}
      slots={{ slot: children }}
      animation={oscilar(['items', 'bg', 'personaje'], 0.5, 0.08, 1)}
    />
  )
}
