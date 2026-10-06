import { describe, it, expect, afterEach, afterAll } from 'bun:test'
import { FORMATO_ID_DOJO, type CapituloDojo } from '../wss/validators/dojo'

import redis from '../wss/redis'
import * as db from '../wss/dojo/db'

const ID = 'f'.repeat(32)
const CAPITULO: CapituloDojo = { coleccion: 'ogs', capitulo: '01-fundamentos' }

const emitidos: string[] = []

async function limpiar() {
  for (const id of [ID, ...emitidos.splice(0)]) {
    const claves = await redis.keys(`dojo:${id}:*`)
    if (claves.length) await redis.del(...claves)
  }
}

afterEach(limpiar)
afterAll(limpiar)

describe('ids del dojo', () => {
  it('un id emitido existe', async () => {
    const id = await db.emitirId()
    emitidos.push(id)
    expect(id).toMatch(FORMATO_ID_DOJO)
    expect(await db.existe(id)).toBe(true)
  })

  it('un id no emitido no existe', async () => {
    expect(await db.existe('0'.repeat(32))).toBe(false)
  })
})

describe('progreso del dojo en redis', () => {
  it('sin nada guardado devuelve vacío', async () => {
    expect(await db.getProgreso(ID, CAPITULO)).toEqual({ resueltos: [], actual: null })
  })

  it('agregar resueltos es una unión', async () => {
    await db.agregarResueltos(ID, CAPITULO, ['a', 'b'])
    await db.agregarResueltos(ID, CAPITULO, ['b', 'c'])
    const { resueltos } = await db.getProgreso(ID, CAPITULO)
    expect(resueltos.sort()).toEqual(['a', 'b', 'c'])
  })

  it('no pisa el timestamp de un desafío ya resuelto', async () => {
    await db.agregarResueltos(ID, CAPITULO, ['a'], 1000)
    await db.agregarResueltos(ID, CAPITULO, ['a'], 2000)
    expect(await redis.zscore(`dojo:${ID}:resueltos:ogs:01-fundamentos`, 'a')).toBe('1000')
  })

  it('separa capítulos', async () => {
    await db.agregarResueltos(ID, CAPITULO, ['a'])
    await db.setActual(ID, CAPITULO, 'a')
    expect(await db.getProgreso(ID, { ...CAPITULO, capitulo: '02-principios-basicos' })).toEqual({
      resueltos: [],
      actual: null,
    })
  })

  it('separa colecciones con el mismo capítulo', async () => {
    await db.agregarResueltos(ID, CAPITULO, ['a'])
    await db.setActual(ID, CAPITULO, 'a')
    expect(await db.getProgreso(ID, { ...CAPITULO, coleccion: 'otra' })).toEqual({ resueltos: [], actual: null })
  })

  it('el actual es el último guardado', async () => {
    await db.setActual(ID, CAPITULO, 'a')
    await db.setActual(ID, CAPITULO, 'b')
    expect((await db.getProgreso(ID, CAPITULO)).actual).toBe('b')
  })
})
