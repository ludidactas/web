import { LdSvg } from "@/components/custom/ld-svg"
import { ComponentProps } from "react"
import { number } from "zod"

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

export function pulsarSecuencial(
  ids: string[], 
  duracion: number,
  escalaMax = 1.3
): ComponentProps<typeof LdSvg>['animation'] {
  const transformInicial = new Map<string, any>()
  
  return (nodos, t) => {
    const dt = duracion
    const ta = t % dt
    const mdt = dt / ids.length
    
    ids.forEach((id, i) => {
      if (!nodos[id]) {
        console.warn(`Nodo "${id}" no encontrado`)
        return
      }
      
      // Guardar transform inicial solo una vez
      if (!transformInicial.has(id)) {
        transformInicial.set(id, nodos[id].transform())
      }
      
      const inicio = i * mdt
      const fin = (i + 1) * mdt
      const activo = ta >= inicio && ta < fin
      
      const escala = activo ? escalaMax : 1
      
      try {
        const bbox = nodos[id].bbox()
        const cx = bbox.cx
        const cy = bbox.cy
        
        // Resetear al transform inicial antes de escalar
        const inicial = transformInicial.get(id)
        nodos[id].transform(inicial)
        
        // Aplicar escala desde el centro
        nodos[id].scale(escala, escala, cx, cy)
      } catch (error) {
        console.error(`Error animando "${id}":`, error)
      }
    })
  }
}
