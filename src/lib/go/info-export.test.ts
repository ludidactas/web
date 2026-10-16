import { describe, expect, test } from 'bun:test'
import { infoExport, subtituloImagen, tituloImagen } from './info-export'

function partida(overrides: {
  ganadorUserId: string | null
  resultado: { negro: number; blanco: number; ganador: 'negro' | 'blanco' | 'empate' } | null
}) {
  return {
    modo: 'partida' as const,
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
      modo: 'partida',
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

describe('textos de la imagen', () => {
  test('título: el nombre del ganador o "Empate"', () => {
    const ganaBlanco = infoExport(partida({ ganadorUserId: 'blanco-id', resultado: null }))
    expect(tituloImagen(ganaBlanco)).toBe('Ganó Jugador Blanco')
    const empate = infoExport(partida({ ganadorUserId: null, resultado: { negro: 9, blanco: 9, ganador: 'empate' } }))
    expect(tituloImagen(empate)).toBe('Empate')
  })

  test('subtítulo: modo, día y los dos jugadores', () => {
    const info = infoExport({ ...partida({ ganadorUserId: null, resultado: null }), modo: 'atari' })
    expect(subtituloImagen(info, '2026-10-16T15:00:00.000Z')).toBe(
      'Atari Go el 16/10/26 · Jugador Negro vs Jugador Blanco'
    )
  })
})
