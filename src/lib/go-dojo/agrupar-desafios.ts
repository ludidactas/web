import type { Desafio } from './tipos'

/** Desafíos consecutivos con el mismo título base ("Capturar (1)", "Capturar (2)"...) forman una sección desde esta cantidad. */
export const MIN_DESAFIOS_POR_SECCION = 5

export interface SeccionDesafios {
  /** Título de la sección, o null si son pocos desafíos y se muestran sueltos. */
  titulo: string | null
  /** Cada desafío con su posición `i` en la lista completa. */
  items: { desafio: Desafio; i: number }[]
}

/** El título sin su numeración final: "Capturar (3)" → "Capturar". */
const tituloBase = (titulo: string) => titulo.replace(/\s*\(\d+\)$/, '')

/** Agrupa corridas consecutivas de desafíos con el mismo título base. */
export function agruparDesafios(desafios: Desafio[]): SeccionDesafios[] {
  const corridas: { base: string; items: SeccionDesafios['items'] }[] = []
  desafios.forEach((desafio, i) => {
    const base = tituloBase(desafio.titulo)
    const ultima = corridas.at(-1)
    if (ultima?.base === base) ultima.items.push({ desafio, i })
    else corridas.push({ base, items: [{ desafio, i }] })
  })
  return corridas.map((c) => ({ titulo: c.items.length >= MIN_DESAFIOS_POR_SECCION ? c.base : null, items: c.items }))
}
