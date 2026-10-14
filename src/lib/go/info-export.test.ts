import { describe, expect, test } from 'bun:test'
import { infoExport, type InfoExport } from './info-export'

function partida(overrides: {
  ganadorUserId: string | null
  resultado: { negro: number; blanco: number; ganador: 'negro' | 'blanco' | 'empate' } | null
}) {
  return {
    negro: { userId: 'negro-id', nombre: 'Jugador Negro' },
    blanco: { userId: 'blanco-id', nombre: 'Jugador Blanco' },
    ganadorUserId: overrides.ganadorUserId,
    resultado: overrides.resultado,
  }
}

describe('infoExport', () => {
  test('conteo: ganador y puntos', () => {
    const info = infoExport(
      partida({
        ganadorUserId: 'negro-id',
        resultado: { negro: 12, blanco: 8, ganador: 'negro' },
      })
    )
    expect(info).toEqual({
      negro: 'Jugador Negro',
      blanco: 'Jugador Blanco',
      ganador: 'negro',
      puntos: { negro: 12, blanco: 8 },
    })
  })

  test('abandono: ganador, sin puntos', () => {
    const info = infoExport(partida({ ganadorUserId: 'blanco-id', resultado: null }))
    expect(info.ganador).toBe('blanco')
    expect(info.puntos).toBeNull()
  })

  test('empate: sin ganador', () => {
    const info = infoExport(partida({ ganadorUserId: null, resultado: { negro: 9, blanco: 9, ganador: 'empate' } }))
    expect(info.ganador).toBeNull()
    expect(info.puntos).toEqual({ negro: 9, blanco: 9 })
  })
})
