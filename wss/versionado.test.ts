import { describe, it, expect } from 'bun:test'
import { z } from 'zod'
import { versionado } from './versionado'

// Evolución de ejemplo: v0 { nombre } → v1 { nombre, apellido } → v2 { nombreCompleto }
const schema = z.object({ nombreCompleto: z.string() })
const codec = versionado({
  schema,
  migraciones: [
    (d) => ({ ...d, apellido: d.apellido ?? '' }),
    (d) => ({ nombreCompleto: `${d.nombre} ${d.apellido}`.trim() }),
  ],
})

describe('versionado', () => {
  it('la versión actual es la cantidad de migraciones', () => {
    expect(codec.version).toBe(2)
    expect(versionado({ schema: z.object({}) }).version).toBe(0)
  })

  it('un documento sin `v` es v0 y pasa por todas las migraciones', () => {
    expect(codec.parsear(JSON.stringify({ nombre: 'Ada' }))).toEqual({ nombreCompleto: 'Ada' })
  })

  it('aplica solo las migraciones que faltan', () => {
    const v1 = JSON.stringify({ v: 1, nombre: 'Ada', apellido: 'Lovelace' })
    expect(codec.parsear(v1)).toEqual({ nombreCompleto: 'Ada Lovelace' })
  })

  it('un documento en la versión actual no se migra', () => {
    expect(codec.parsear(JSON.stringify({ v: 2, nombreCompleto: 'Ada L' }))).toEqual({ nombreCompleto: 'Ada L' })
  })

  it('serializar marca la versión actual y roundtrip', () => {
    const str = codec.serializar({ nombreCompleto: 'Ada L' })
    expect(JSON.parse(str).v).toBe(2)
    expect(codec.parsear(str)).toEqual({ nombreCompleto: 'Ada L' })
  })

  it('rechaza una versión más nueva que la conocida (rollback de deploy)', () => {
    expect(() => codec.parsear(JSON.stringify({ v: 3, nombreCompleto: 'x' }))).toThrow(/más nueva/)
  })

  it('rechaza versión inválida y documentos que no son objetos', () => {
    for (const v of ['1', -1, 1.5, null]) {
      expect(() => codec.parsear(JSON.stringify({ v, nombre: 'x' }))).toThrow(/versión inválida/)
    }
    expect(() => codec.parsear('[]')).toThrow(/objeto/)
    expect(() => codec.parsear('"x"')).toThrow(/objeto/)
  })

  it('un documento que no cumple el schema actual lanza (no se pasa de largo)', () => {
    expect(() => codec.parsear(JSON.stringify({ v: 2, otra: 1 }))).toThrow()
  })
})
