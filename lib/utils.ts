import { LdSvg } from '@/components/custom/ld-svg'
import { clsx, type ClassValue } from 'clsx'
import { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * En el contexto de usar LdSvg, esta función se encarga de crear una animación que
 * secuencia la aparición de una cantidad de ids, como para hacer una animación cuadro por cuadro.
 *
 * E.g:
 *
 * dt = 300 ms
 * mdt = 300 / 3 = 100 ms
 *
 * i = 0 -> i * mdt = 0, (i + 1) * mdt = 100
 * i = 1 -> i * mdt = 100, (i + 1) * mdt = 200
 * i = 2 -> i * mdt = 200, (i + 1) * mdt = 300
 *
 * | id1 | id2 | id3 |
 * | 0   | 1   | 2   |
 * | X   |     |     |
 * |     | X   |     |
 * |     |     | X   |
 * | mdt | mdt | mdt |
 * |       dt        |
 *
 * @param ids
 * @param duracion
 * @returns
 */
export function secuenciar(ids: string[], duracion: number): ComponentProps<typeof LdSvg>['animation'] {
  return (nodos, t) => {
    const dt = duracion
    const ta = t % dt // tiempo actual
    ids.forEach((id, i) => {
      const mdt = dt / ids.length // mini dt
      nodos[id].attr({ opacity: i * mdt < ta && ta < (i + 1) * mdt ? 1 : 0 })
    })
  }
}
