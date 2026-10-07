import { describe, it, expect } from 'bun:test'
import {
  FORMATO_ID_DOJO,
  MAX_RESUELTOS_SINCRONIZAR,
  desafioDojoSchema,
  sincronizarDojoSchema,
} from '../../validators/dojo'
import { PasaporteDojoSchema } from '../../validators/auth'

const OGS = 'ogs'

describe('formato del id', () => {
  it('32 hex en minúscula', () => {
    expect(FORMATO_ID_DOJO.test('a'.repeat(32))).toBe(true)
    for (const id of ['', 'a'.repeat(31), 'A'.repeat(32), 'g'.repeat(32), 'dojo:*']) {
      expect(FORMATO_ID_DOJO.test(id)).toBe(false)
    }
  })
})

describe('pasaporte del dojo', () => {
  it('el id es opcional y acotado', () => {
    expect(PasaporteDojoSchema.safeParse({ rol: 'dojo' }).success).toBe(true)
    expect(PasaporteDojoSchema.safeParse({ rol: 'dojo', idDojo: 'a'.repeat(32) }).success).toBe(true)
    expect(PasaporteDojoSchema.safeParse({ rol: 'dojo', idDojo: 'a'.repeat(65) }).success).toBe(false)
  })

  it('no admite campos de otros roles', () => {
    expect(PasaporteDojoSchema.safeParse({ rol: 'dojo', idSala: 'x' }).success).toBe(false)
  })
})

describe('payloads del dojo', () => {
  it('colección y capítulo solo como slug', () => {
    const valido = { coleccion: OGS, capitulo: '01-fundamentos', desafio: 'x' }
    expect(desafioDojoSchema.safeParse(valido).success).toBe(true)
    expect(desafioDojoSchema.safeParse({ ...valido, capitulo: '01:fundamentos' }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ ...valido, capitulo: 'a'.repeat(65) }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ ...valido, coleccion: 'og:s' }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ ...valido, coleccion: 'a'.repeat(33) }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ capitulo: '01-fundamentos', desafio: 'x' }).success).toBe(false)
  })

  it('desafío acotado', () => {
    expect(desafioDojoSchema.safeParse({ coleccion: OGS, capitulo: 'c', desafio: '' }).success).toBe(false)
    expect(desafioDojoSchema.safeParse({ coleccion: OGS, capitulo: 'c', desafio: 'x'.repeat(129) }).success).toBe(false)
  })

  it('resueltos acotados', () => {
    const resueltos = Array.from({ length: MAX_RESUELTOS_SINCRONIZAR + 1 }, (_, i) => `d${i}`)
    expect(sincronizarDojoSchema.safeParse({ coleccion: OGS, capitulo: 'c', resueltos }).success).toBe(false)
    expect(sincronizarDojoSchema.safeParse({ coleccion: OGS, capitulo: 'c', resueltos: resueltos.slice(1) }).success).toBe(true)
  })
})
