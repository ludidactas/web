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
  it('los eventos de partida no serializan los userId reales', () => {
    const publica = partidaPublica(partida('20333444555', 'profe@escuela.com', '20333444555'))

    expect(JSON.stringify(publica)).not.toContain('20333444555')
    expect(JSON.stringify(publica)).not.toContain('profe@escuela.com')
    expect(JSON.stringify(publica)).not.toContain('userId')

    expect(publica.negro).toEqual({ id: idOpaco(SALA, '20333444555'), nombre: 'Ana' })
    expect(publica.blanco).toEqual({ id: idOpaco(SALA, 'profe@escuela.com'), nombre: 'Bruno' })
    expect(publica.ganadorId).toBe(idOpaco(SALA, '20333444555'))
    expect(publica.tablero).toEqual(partida('20333444555', 'profe@escuela.com').tablero)
  })

  it('sin ganador, `ganadorId` queda null', () => {
    expect(partidaPublica(partida('a', 'b')).ganadorId).toBeNull()
  })
})

describe('contrincantesDesde', () => {
  it('la lista que se emite a un estudiante no serializa el DNI de compañeros ni el email del profe', async () => {
    const contrincantes = await contrincantesDesde(
      [
        { userId: '20333444555', nombre: 'Ana', conectado: true },
        { userId: 'profesor@escuela.com', nombre: 'Profe', conectado: true },
      ],
      SALA,
      '20333444556',
      'opacas'
    )

    const json = JSON.stringify(contrincantes)
    expect(json).not.toContain('20333444555')
    expect(json).not.toContain('profesor@escuela.com')
    expect(json).not.toContain('userId')

    expect(contrincantes[0].id).toBe(idOpaco(SALA, '20333444555'))
    expect(contrincantes[1].id).toBe(idOpaco(SALA, 'profesor@escuela.com'))
    expect(contrincantes.map((c) => c.nombre)).toEqual(['Ana', 'Profe'])
  })

  it('el profe recibe los userId reales, con los que cruza su planilla', async () => {
    const contrincantes = await contrincantesDesde(
      [{ userId: '20333444555', nombre: 'Ana', conectado: true }],
      SALA,
      'profesor@escuela.com',
      'reales'
    )

    expect(contrincantes[0].id).toBe('20333444555')
  })
})
