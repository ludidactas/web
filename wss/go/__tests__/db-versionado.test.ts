import { afterEach, describe, expect, it } from 'bun:test'
import redis from '../../redis'
import { borrarSala } from '../../salas/db'
import type { Partida } from '../../validators/go'
import { getPartida, guardarPartida } from '../db'

const SALA = `test-versionado-${crypto.randomUUID()}`

const partida: Partida = {
  id: 'p1',
  salaId: SALA,
  tamaño: 9,
  modo: 'atari',
  negro: { userId: 'ana', nombre: 'Ana' },
  blanco: { userId: 'bruno', nombre: 'Bruno' },
  tablero: [
    ['.', 'N'],
    ['B', '.'],
  ],
  turno: 'N',
  capturasNegras: 0,
  capturasBlancas: 0,
  pases: 0,
  historial: ['h1'],
  ultimaJugada: { fila: 0, columna: 1 },
  removidas: null,
  vivo: null,
  confirmaron: { negro: false, blanco: false },
  estado: 'jugando',
  resultado: null,
  motivoFin: null,
  ganadorUserId: null,
  creadaEn: '2026-01-01T00:00:00.000Z',
}

afterEach(() => borrarSala(SALA))

describe('partidas de Go en redis', () => {
  it('guardar y leer devuelve la misma partida', async () => {
    await guardarPartida(partida)
    expect(await getPartida(SALA, 'p1')).toEqual(partida)
    expect(JSON.parse((await redis.get(`sala:${SALA}:go:p1`))!).v).toBe(0)
  })

  it('una partida anterior a los modos se lee como `partida`', async () => {
    const { modo: _modo, ...sinModo } = partida
    await redis.set(`sala:${SALA}:go:p1`, JSON.stringify(sinModo))
    expect((await getPartida(SALA, 'p1'))?.modo).toBe('partida')
  })

  it('una partida inexistente da null', async () => {
    expect(await getPartida(SALA, 'nada')).toBeNull()
  })
})
