import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { idOpaco } from '../../id-opaco'
import redis from '../../redis'
import { borrarSala } from '../../salas/db'

let salaA = ''
let salaB = ''

beforeEach(() => {
  salaA = `test-id-opaco-a-${crypto.randomUUID()}`
  salaB = `test-id-opaco-b-${crypto.randomUUID()}`
})

afterEach(async () => {
  await borrarSala(salaA)
  await borrarSala(salaB)
})

describe('idOpaco', () => {
  const identidad = '20333444555'

  it('la misma identidad y sala dan el mismo id, también en llamadas simultáneas', async () => {
    const [uno, dos] = await Promise.all([idOpaco(salaA, identidad), idOpaco(salaA, identidad)])
    const simultaneos = await Promise.all(Array.from({ length: 10 }, () => idOpaco(salaA, identidad)))

    expect(new Set([uno, dos, ...simultaneos]).size).toBe(1)
    expect(await redis.hlen(`sala:${salaA}:ids`)).toBe(1)
  })

  it('la misma identidad en otra sala da otro id', async () => {
    expect(await idOpaco(salaA, identidad)).not.toBe(await idOpaco(salaB, identidad))
  })

  it('el id no contiene la identidad', async () => {
    const id = await idOpaco(salaA, identidad)

    expect(id).not.toContain(identidad)
    expect(id).toMatch(/^[0-9a-f]{16}$/)
  })

  it('identidades distintas en la misma sala dan ids distintos', async () => {
    expect(await idOpaco(salaA, identidad)).not.toBe(await idOpaco(salaA, 'profe@escuela.com'))
  })
})
