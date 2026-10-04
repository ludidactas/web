import { describe, it, expect, afterEach, afterAll } from 'bun:test'
import type { Socket } from 'socket.io'
import type { Ack } from '../wss/middleware/error-handling'
import { FORMATO_ID_DOJO } from '../wss/validators/dojo'

import redis from '../wss/redis'
import * as db from '../wss/dojo/db'
import { handlersDojo } from '../wss/dojo/handlers'

const CAPITULO = '01-fundamentos'

const emitidos: string[] = []

async function limpiar() {
  for (const id of emitidos.splice(0)) {
    const claves = await redis.keys(`dojo:${id}:*`)
    if (claves.length) await redis.del(...claves)
  }
}

afterEach(limpiar)
afterAll(limpiar)

async function conectar() {
  const handlers = new Map<string, (...args: unknown[]) => Promise<void>>()
  const socket = {
    on: (evento: string, fn: (...args: unknown[]) => Promise<void>) => handlers.set(evento, fn),
    emit: () => true,
  } as unknown as Socket
  await handlersDojo(socket)

  return async function emitir<T>(evento: string, payload: unknown): Promise<Ack<T>> {
    let respuesta: Ack<T> | undefined
    await handlers.get(evento)!(payload, (res: Ack<T>) => (respuesta = res))
    return respuesta!
  }
}

async function identificado(idDojo?: string) {
  const emitir = await conectar()
  const res = await emitir<string>('dojo:identificarse', { idDojo })
  if (!res.ok) throw new Error(res.error)
  emitidos.push(res.data)
  return { emitir, id: res.data }
}

describe('dojo:identificarse', () => {
  it('sin id emite uno nuevo', async () => {
    const { id } = await identificado()
    expect(id).toMatch(FORMATO_ID_DOJO)
    expect(await db.existe(id)).toBe(true)
  })

  it('con un id emitido devuelve el mismo sin tocar su creación', async () => {
    const id = await db.emitirId(1000)
    emitidos.push(id)
    const { id: devuelto } = await identificado(id)
    expect(devuelto).toBe(id)
    expect(await redis.get(`dojo:${id}:creado`)).toBe('1000')
  })

  it('con un id no emitido emite uno nuevo', async () => {
    const pedido = '0'.repeat(32)
    const { id } = await identificado(pedido)
    expect(id).not.toBe(pedido)
    expect(await db.existe(pedido)).toBe(false)
  })

  it('con un id de formato inválido emite uno nuevo', async () => {
    const { id } = await identificado('dojo:*')
    expect(id).toMatch(FORMATO_ID_DOJO)
  })
})

describe('comandos del dojo', () => {
  it('rechaza comandos antes de identificarse', async () => {
    const emitir = await conectar()
    const res = await emitir('dojo:sincronizar', { capitulo: CAPITULO, resueltos: [] })
    expect(res).toEqual({ ok: false, error: 'Visitante del dojo sin identificar' })
  })

  it('sincronizar devuelve la unión con lo guardado', async () => {
    const { emitir, id } = await identificado()
    await db.agregarResueltos(id, CAPITULO, ['a'])
    await db.setActual(id, CAPITULO, 'a')

    const res = await emitir<{ resueltos: string[]; actual: string | null }>('dojo:sincronizar', {
      capitulo: CAPITULO,
      resueltos: ['b'],
    })

    if (!res.ok) throw new Error(res.error)
    expect(res.data.resueltos.sort()).toEqual(['a', 'b'])
    expect(res.data.actual).toBe('a')
  })

  it('resuelto y actual quedan guardados', async () => {
    const { emitir, id } = await identificado()
    expect((await emitir('dojo:resuelto', { capitulo: CAPITULO, desafio: 'a' })).ok).toBe(true)
    expect((await emitir('dojo:actual', { capitulo: CAPITULO, desafio: 'b' })).ok).toBe(true)
    expect(await db.getProgreso(id, CAPITULO)).toEqual({ resueltos: ['a'], actual: 'b' })
  })

  it('rechaza un payload inválido', async () => {
    const { emitir } = await identificado()
    const res = await emitir('dojo:actual', { capitulo: '01:fundamentos', desafio: 'a' })
    expect(res.ok).toBe(false)
  })
})
