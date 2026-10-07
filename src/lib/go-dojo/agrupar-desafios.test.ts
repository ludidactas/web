import { describe, expect, test } from 'bun:test'
import { agruparDesafios, MIN_DESAFIOS_POR_SECCION } from './agrupar-desafios'
import type { Desafio } from './tipos'

const desafio = (titulo: string) => ({ id: titulo, titulo }) as Desafio
const serie = (base: string, n: number) => Array.from({ length: n }, (_, k) => desafio(`${base} (${k + 1})`))

describe('agruparDesafios', () => {
  test('una serie larga forma una sección con título', () => {
    const [seccion] = agruparDesafios(serie('Capturar', MIN_DESAFIOS_POR_SECCION))
    expect(seccion.titulo).toBe('Capturar')
    expect(seccion.items).toHaveLength(MIN_DESAFIOS_POR_SECCION)
  })

  test('una serie corta queda sin título', () => {
    const [seccion] = agruparDesafios(serie('Capturar', MIN_DESAFIOS_POR_SECCION - 1))
    expect(seccion.titulo).toBeNull()
  })

  test('conserva la posición de cada desafío en la lista completa', () => {
    const secciones = agruparDesafios([desafio('Intro'), ...serie('Capturar', 5)])
    expect(secciones.map((s) => s.titulo)).toEqual([null, 'Capturar'])
    expect(secciones[1].items.map((x) => x.i)).toEqual([1, 2, 3, 4, 5])
  })

  test('solo agrupa corridas consecutivas', () => {
    const secciones = agruparDesafios([...serie('A', 3), desafio('B'), ...serie('A', 3)])
    expect(secciones).toHaveLength(3)
  })

  test('sin desafíos no hay secciones', () => {
    expect(agruparDesafios([])).toEqual([])
  })
})
