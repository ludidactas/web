import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { idOpaco } from '../../id-opaco'
import redis from '../../redis'
import { borrarSala } from '../../salas/db'
import { contrincantesDesde, partidaPublica } from '../app'
import { EstadoPartida, type Partida } from '../../validators/go'

const SALA = 'sala-test-opaco'
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

function partida(negroUserId: string, blancoUserId: string, ganadorUserId: string | null = null): Partida {
  return {
    id: 'p1',
    salaId: SALA,
    tamaño: 9,
    modo: 'partida',
    negro: { userId: negroUserId, nombre: 'Ana' },
    blanco: { userId: blancoUserId, nombre: 'Bruno' },
    tablero: [
      ['.', 'N'],
      ['B', '.'],
    ],
    turno: 'N',
    capturasNegras: 1,
    capturasBlancas: 0,
    pases: 0,
    historial: ['h1'],
    ultimaJugada: { fila: 0, columna: 1 },
    removidas: null,
    vivo: null,
    confirmaron: { negro: false, blanco: false },
    estado: EstadoPartida.Jugando,
    resultado: null,
    motivoFin: null,
    ganadorUserId,
    creadaEn: '2026-01-01T00:00:00.000Z',
  }
}

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

describe('partidaPublica', () => {
  it('emite los userId de la partida como ids públicos, con los nombres intactos', () => {
    // Los userId de la partida ya son handles por sala (id opaco de estudiantes y del profe): la
    // vista pública los pasa tal cual; la opacidad la garantiza la sesión (wss/validators/session.ts).
    const publica = partidaPublica(partida('handle-negro', 'handle-blanco', 'handle-negro'))

    expect(publica.negro).toEqual({ id: 'handle-negro', nombre: 'Ana' })
    expect(publica.blanco).toEqual({ id: 'handle-blanco', nombre: 'Bruno' })
    expect(publica.ganadorId).toBe('handle-negro')
    expect(publica.tablero).toEqual(partida('handle-negro', 'handle-blanco').tablero)
    expect(JSON.stringify(publica)).not.toContain('userId')
  })

  it('sin ganador, `ganadorId` queda null', () => {
    expect(partidaPublica(partida('a', 'b')).ganadorId).toBeNull()
  })
})

describe('contrincantesDesde', () => {
  it('emite el handle de cada persona como id, sin exponer otra identidad', async () => {
    const contrincantes = await contrincantesDesde(
      [
        { userId: 'handle-ana', nombre: 'Ana', conectado: true },
        { userId: 'handle-profe', nombre: 'Profe', conectado: true, roomId: 'profe@escuela.com' },
      ],
      SALA,
      'handle-yo'
    )

    expect(contrincantes.map((c) => c.id)).toEqual(['handle-ana', 'handle-profe'])
    expect(contrincantes.map((c) => c.nombre)).toEqual(['Ana', 'Profe'])
    expect(JSON.stringify(contrincantes)).not.toContain('profe@escuela.com')
  })
})
