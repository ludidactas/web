import { afterAll, describe, expect, it } from 'bun:test'
import redis from '../wss/redis'
import { correrMigraciones, type Migracion } from '../wss/migraciones/runner'

const prefijo = `test-migraciones-${crypto.randomUUID()}`
const opciones = { prefijo, esperaMs: 10 }

afterAll(async () => {
  await redis.del(`${prefijo}:aplicadas`, `${prefijo}:lock`)
})

describe('correrMigraciones', () => {
  it('aplica en orden las pendientes y no repite las ya aplicadas', async () => {
    const orden: string[] = []
    const lista: Migracion[] = ['a', 'b'].map((id) => ({ id, up: async () => void orden.push(id) }))

    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['a', 'b'])
    expect(await correrMigraciones(redis, lista, opciones)).toEqual([])

    lista.push({ id: 'c', up: async () => void orden.push('c') })
    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['c'])
    expect(orden).toEqual(['a', 'b', 'c'])
  })

  it('una migración que tira corta la corrida, queda pendiente y libera el lock', async () => {
    let intentos = 0
    const lista: Migracion[] = [
      {
        id: 'falla-una-vez',
        up: async () => {
          if (++intentos === 1) throw new Error('boom')
        },
      },
      { id: 'despues', up: async () => {} },
    ]

    await expect(correrMigraciones(redis, lista, opciones)).rejects.toThrow('boom')
    expect(await redis.exists(`${prefijo}:lock`)).toBe(0)
    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['falla-una-vez', 'despues'])
  })

  it('dos instancias a la vez: la migración corre una sola vez', async () => {
    let corridas = 0
    const lista: Migracion[] = [
      {
        id: 'concurrente',
        up: async () => {
          corridas++
          await new Promise((r) => setTimeout(r, 50))
        },
      },
    ]

    await Promise.all([correrMigraciones(redis, lista, opciones), correrMigraciones(redis, lista, opciones)])
    expect(corridas).toBe(1)
  })
})
