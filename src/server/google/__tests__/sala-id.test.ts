import { describe, expect, it } from 'bun:test'

import { esSalaIdValido } from '../sala-id'

describe('esSalaIdValido', () => {
  it('acepta los ids de 8 hex emitidos antes del cambio a 128 bits', () => {
    expect(esSalaIdValido('a1b2c3d4')).toBe(true)
  })

  it('acepta los ids nuevos de 128 bits (32 hex)', () => {
    expect(esSalaIdValido('0123456789abcdef0123456789abcdef')).toBe(true)
  })

  it('rechaza cualquier valor que no sea uno de esos dos formatos', () => {
    for (const valor of ['sala-1', 'A1B2C3D4', '0123456789abcdef', "a1b2c3d4' OR 1=1", '']) {
      expect(esSalaIdValido(valor)).toBe(false)
    }
  })
})
