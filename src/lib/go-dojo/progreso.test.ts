import { describe, expect, test } from 'bun:test'
import { fusionarProgreso } from './progreso'

describe('fusionarProgreso', () => {
  test('une los resueltos sin duplicar y conserva el orden local primero', () => {
    const unido = fusionarProgreso({ resueltos: ['a', 'b'], actual: null }, { resueltos: ['b', 'c'], actual: null })
    expect(unido.resueltos).toEqual(['a', 'b', 'c'])
  })

  test('el actual remoto gana', () => {
    expect(fusionarProgreso({ resueltos: [], actual: 'a' }, { resueltos: [], actual: 'c' }).actual).toBe('c')
  })

  test('sin actual remoto queda el local', () => {
    expect(fusionarProgreso({ resueltos: [], actual: 'a' }, { resueltos: [], actual: null }).actual).toBe('a')
  })

  test('sin nada en ninguno queda vacío', () => {
    expect(fusionarProgreso({ resueltos: [], actual: null }, { resueltos: [], actual: null })).toEqual({
      resueltos: [],
      actual: null,
    })
  })
})
