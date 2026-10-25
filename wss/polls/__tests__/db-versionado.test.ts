import { afterEach, describe, expect, it } from 'bun:test'
import redis from '../../redis'
import { borrarSala } from '../../salas/db'
import type { Encuesta } from '../../validators/polls'
import { getEncuesta, guardarEncuesta } from '../db'

const SALA = `test-versionado-${crypto.randomUUID()}`

const encuesta: Encuesta = {
  id: 'e1',
  pregunta: '¿Cuál prefieren?',
  opciones: [
    { id: '0', texto: 'A' },
    { id: '1', texto: 'B' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  isOpen: true,
  isPublished: true,
  isFocused: false,
  isRevealed: false,
  admiteAportes: false,
  admiteMultiplesVotos: false,
  maxMultiplesVotos: null,
}

afterEach(() => borrarSala(SALA))

describe('encuestas en redis', () => {
  it('guardar y leer devuelve la misma encuesta', async () => {
    await guardarEncuesta(SALA, encuesta)
    expect(await getEncuesta(SALA, 'e1')).toEqual(encuesta)
    expect(JSON.parse((await redis.get(`sala:${SALA}:polls:e1`))!).v).toBe(0)
  })

  it('una encuesta guardada sin flags opcionales se lee con sus defaults', async () => {
    const { isFocused: _f, admiteAportes: _a, maxMultiplesVotos: _m, ...vieja } = encuesta
    await redis.set(`sala:${SALA}:polls:e1`, JSON.stringify(vieja))
    const leida = await getEncuesta(SALA, 'e1')
    expect(leida).toMatchObject({ isFocused: false, admiteAportes: false, maxMultiplesVotos: null })
  })
})
