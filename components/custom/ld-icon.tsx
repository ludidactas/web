'use client'

import { Icon, type IconProps } from '@iconify/react'
import type { IconosDisponibles } from '@/lib/iconos'

interface IconitoProps extends Omit<IconProps, 'icon'> {
  icon: IconosDisponibles
}

export function Iconito(props: IconitoProps) {
  return <Icon {...props} />
}
