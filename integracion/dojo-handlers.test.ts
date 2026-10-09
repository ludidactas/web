import { describe, it, expect, afterEach, afterAll } from 'bun:test'
import type { Socket } from 'socket.io'
import type { Ack } from '../wss/contrato/definir'
import { FORMATO_ID_DOJO, type CapituloDojo } from '../wss/validators/dojo'

import redis from '../wss/redis'
import * as db from '../wss/dojo/db'
import { handlersDojo } from '../wss/dojo/handlers'

const CAPITULO: CapituloDojo = { coleccion: 'ogs', capitulo: '01-fundamentos' }

const emitidos: string[] = []

async function limpiar() {
  for (const id of emitidos.splice(0)) {
    const claves = await redis.keys(`dojo:${id}:*`)
    if (claves.length) await redis.del(...claves)
  }
}

afterEach(limpiar)
afterAll(limpiar)

/** Conecta un visitante con el `idDojo` pedido en el pasaporte y devuelve cómo emitirle comandos. */
function conectar(idDojo?: string) {
  const handlers = new Map<string, (...args: unknown[]) => Promise<void>>()
  const socket = {
    handshake: { auth: { rol: 'dojo', idDojo } },
    on: (evento: string, fn: (...args: unknown[]) => Promise<void>) => handlers.set(evento, fn),
    emit: () => true,
  } as unknown as Socket
  handlersDojo(socket)

  return async function emitir<T>(evento: string, payload?: unknown): Promise<Ack<T>> {
    let respuesta: Ack<T> | undefined
    await handlers.get(evento)!(payload, (res: Ack<T>) => (respuesta = res))
    return respuesta!
  }
}

async function identificado(idDojo?: string) {
  const emitir = conectar(idDojo)
  const res = await emitir<string>('dojo:identificarse')
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

  it('devuelve siempre el mismo id en una conexión', async () => {
    const { emitir, id } = await identificado()
    const otra = await emitir<string>('dojo:identificarse')
    expect(otra).toEqual({ ok: true, data: id })
  })
})

describe('comandos del dojo', () => {
  it('un comando antes de identificarse espera al id y se guarda en él', async () => {
    const id = await db.emitirId()
    emitidos.push(id)
    const emitir = conectar(id)

    const res = await emitir('dojo:resuelto', { ...CAPITULO, desafio: 'offline' })

    expect(res.ok).toBe(true)
    expect((await db.getProgreso(id, CAPITULO)).resueltos).toEqual(['offline'])
  })

  it('sincronizar devuelve la unión con lo guardado', async () => {
    const { emitir, id } = await identificado()
    await db.agregarResueltos(id, CAPITULO, ['a'])
    await db.setActual(id, CAPITULO, 'a')

    const res = await emitir<{ resueltos: string[]; actual: string | null }>('dojo:sincronizar', {
      ...CAPITULO,
      resueltos: ['b'],
    })

    if (!res.ok) throw new Error(res.error)
    expect(res.data.resueltos.sort()).toEqual(['a', 'b'])
    expect(res.data.actual).toBe('a')
  })

  it('resuelto y actual quedan guardados', async () => {
    const { emitir, id } = await identificado()
    expect((await emitir('dojo:resuelto', { ...CAPITULO, desafio: 'a' })).ok).toBe(true)
    expect((await emitir('dojo:actual', { ...CAPITULO, desafio: 'b' })).ok).toBe(true)
    expect(await db.getProgreso(id, CAPITULO)).toEqual({ resueltos: ['a'], actual: 'b' })
  })

  it('rechaza un payload inválido', async () => {
    const { emitir } = await identificado()
    const res = await emitir('dojo:actual', { ...CAPITULO, capitulo: '01:fundamentos', desafio: 'a' })
    expect(res.ok).toBe(false)
  })

  it('rechaza un payload sin colección', async () => {
    const { emitir } = await identificado()
    const res = await emitir('dojo:actual', { capitulo: CAPITULO.capitulo, desafio: 'a' })
    expect(res.ok).toBe(false)
  })
})
