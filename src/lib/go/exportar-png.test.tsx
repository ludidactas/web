import { describe, expect, mock, test } from 'bun:test'
import { BLANCO, NEGRO, tableroVacio } from './motor'

mock.module('next/font/local', () => ({
  default: () => ({ style: { fontFamily: 'Chelsea Market' } }),
}))

const { tableroASvg } = await import('./exportar-png')

describe('tableroASvg', () => {
  test('incluye el namespace y las dimensiones del tablero', () => {
    const svg = tableroASvg(tableroVacio(9), 9)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    // ladoDe(9) = 384 + 2 × 16 (margen para la sombra del tablero) = 416
    expect(svg).toContain('width="416"')
    expect(svg).toContain('height="416"')
  })

  test('el <svg> raíz tiene una sola width/height y no queda width="100%"', () => {
    const svg = tableroASvg(tableroVacio(9), 9)
    const apertura = svg.slice(0, svg.indexOf('>'))
    expect(apertura.match(/width="/g)).toHaveLength(1)
    expect(apertura.match(/height="/g)).toHaveLength(1)
    expect(svg).not.toContain('width="100%"')
    expect(svg).not.toContain('height="100%"')
  })

  test('dibuja una piedra por casilla ocupada', () => {
    const tablero = tableroVacio(9)
    tablero[0][0] = NEGRO
    tablero[8][8] = BLANCO

    const svg = tableroASvg(tablero, 9)
    const circleMatches = svg.match(/<circle/g)
    // 5 hoshi + 2 piedras
    expect(circleMatches).toHaveLength(7)
  })
})
