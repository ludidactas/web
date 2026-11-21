import { afterAll, describe, expect, it } from 'bun:test'
import redis from '../wss/redis'
import { correrMigraciones, type Migracion } from '../wss/migraciones/runner'

const prefijo = `test-migraciones-${crypto.randomUUID()}`
const opciones = { prefijo, esperaMs: 10 }
const noop = async () => {}

afterAll(async () => {
  await redis.del(`${prefijo}:aplicadas`, `${prefijo}:lock`)
})

describe('correrMigraciones', () => {
  it('aplica en orden las pendientes (dryRun antes de up) y no repite las ya aplicadas', async () => {
    const orden: string[] = []
    const lista: Migracion[] = ['a', 'b'].map((id) => ({
      id,
      dryRun: async () => void orden.push(`dry:${id}`),
      up: async () => void orden.push(`up:${id}`),
    }))

    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['a', 'b'])
    expect(await correrMigraciones(redis, lista, opciones)).toEqual([])

    lista.push({
      id: 'c',
      dryRun: async () => void orden.push('dry:c'),
      up: async () => void orden.push('up:c'),
    })
    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['c'])
    expect(orden).toEqual(['dry:a', 'up:a', 'dry:b', 'up:b', 'dry:c', 'up:c'])
  })

  it('si dryRun tira, no corre up y libera el lock', async () => {
    let corrioUp = false
    const lista: Migracion[] = [
      {
        id: 'dryrun-falla',
        dryRun: async () => {
          throw new Error('precondición rota')
        },
        up: async () => {
          corrioUp = true
        },
      },
    ]

    await expect(correrMigraciones(redis, lista, opciones)).rejects.toThrow('precondición rota')
    expect(corrioUp).toBe(false)
    expect(await redis.exists(`${prefijo}:lock`)).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, 'dryrun-falla')).toBe(0)
  })

  it('una migración que tira corta la corrida, queda pendiente y libera el lock', async () => {
    let intentos = 0
    const lista: Migracion[] = [
      {
        id: 'falla-una-vez',
        dryRun: noop,
        up: async () => {
          if (++intentos === 1) throw new Error('boom')
        },
      },
      { id: 'despues', dryRun: noop, up: noop },
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
        dryRun: noop,
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
