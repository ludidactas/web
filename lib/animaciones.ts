import { LdSvg } from "@/components/custom/ld-svg"
import { ComponentProps } from "react"

/**
 * En el contexto de usar LdSvg, esta función se encarga de crear una animación que
 * secuencia la aparición de una cantidad de ids, como para hacer una animación cuadro por cuadro.
 *
 * E.g:
 *
 *     dt = 300 ms
 *     mdt = 300 / 3 = 100 ms
 *
 *     i = 0 -> i * mdt = 0, (i + 1) * mdt = 100
 *     i = 1 -> i * mdt = 100, (i + 1) * mdt = 200
 *     i = 2 -> i * mdt = 200, (i + 1) * mdt = 300
 *
 *     | id1 | id2 | id3 |
 *     | 0   | 1   | 2   |
 *     | X   |     |     |
 *     |     | X   |     |
 *     |     |     | X   |
 *     | mdt | mdt | mdt |
 *     |       dt        |
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

export function oscilar(ids: string[], fr: number, a = 5, fase = 1): ComponentProps<typeof LdSvg>['animation'] {
  return (nodos, t) => {
    ids.forEach((id, i) => {
      const ts = t / 1000 - fase * i // tiempo en segundos
      nodos[id].dy(-Math.sin(fr * ts) * a)
    })
  }
}

export function escalar(
  ids: string[], 
  fr: number, 
  escalaMin = 0.8, 
  escalaMax = 1.2, 
  fase = 1
): ComponentProps<typeof LdSvg>['animation'] {
  return (nodos, t) => {
    ids.forEach((id, i) => {
      const ts = t / 1000 - fase * i // tiempo en segundos
      // Calcula la escala usando seno para oscilar entre escalaMin y escalaMax
      const onda = Math.sin(fr * ts)
      const escala = escalaMin + (escalaMax - escalaMin) * (onda + 1) / 2
      
      nodos[id].scale(escala)
    })
  }
}
