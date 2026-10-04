import { describe, it, expect } from 'bun:test'
import {
  FORMATO_ID_DOJO,
  MAX_RESUELTOS_SINCRONIZAR,
  desafioDojoSchema,
  sincronizarDojoSchema,
} from '../../validators/dojo'

describe('formato del id', () => {
  it('32 hex en minúscula', () => {
    expect(FORMATO_ID_DOJO.test('a'.repeat(32))).toBe(true)
    for (const id of ['', 'a'.repeat(31), 'A'.repeat(32), 'g'.repeat(32), 'dojo:*']) {
      expect(FORMATO_ID_DOJO.test(id)).toBe(false)
    }
  })
})

describe('payloads del dojo', () => {
  it('capítulo solo como slug', () => {
    expect(desafioDojoSchema.safeParse({ capitulo: '01-fundamentos', desafio: 'x' }).success).toBe(true)
    expect(desafioDojoSchema.safeParse({ capitulo: '01:fundamentos', desafio: 'x' }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ capitulo: 'a'.repeat(65), desafio: 'x' }).success).toBe(false)
  })

  it('desafío acotado', () => {
    expect(desafioDojoSchema.safeParse({ capitulo: 'c', desafio: '' }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ capitulo: 'c', desafio: 'x'.repeat(129) }).success).toBe(false)
  })

  it('resueltos acotados', () => {
    const resueltos = Array.from({ length: MAX_RESUELTOS_SINCRONIZAR + 1 }, (_, i) => `d${i}`)
    expect(sincronizarDojoSchema.safeParse({ capitulo: 'c', resueltos }).success).toBe(false)
    expect(sincronizarDojoSchema.safeParse({ capitulo: 'c', resueltos: resueltos.slice(1) }).success).toBe(true)
  })
})
