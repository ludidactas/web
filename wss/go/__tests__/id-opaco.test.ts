import { describe, expect, it } from 'bun:test'
import { idOpaco } from '../../id-opaco'
import { contrincantesDesde, partidaPublica } from '../app'
import { EstadoPartida, type Partida } from '../../validators/go'

const SALA = 'sala-test-opaco'

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
  it('es determinístico y por sala: mismo usuario, distinta sala, distinto id', () => {
    expect(idOpaco('sala-a', '20333444555')).toBe(idOpaco('sala-a', '20333444555'))
    expect(idOpaco('sala-a', '20333444555')).not.toBe(idOpaco('sala-b', '20333444555'))
    expect(idOpaco('sala-a', '20333444555')).not.toBe(idOpaco('sala-a', 'profe@escuela.com'))
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
