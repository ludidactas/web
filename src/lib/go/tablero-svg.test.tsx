import { describe, expect, mock, test } from 'bun:test'
import { BLANCO, NEGRO, tableroVacio } from './motor'

mock.module('next/font/local', () => ({
  default: () => ({ style: { fontFamily: 'Chelsea Market' } }),
}))

const { tableroASvg } = await import('./tablero-svg')

describe('tableroASvg', () => {
  test('incluye el namespace y, por defecto, el lado del tablero como dimensiones', () => {
    const svg = tableroASvg(tableroVacio(9), 9, null)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    // ladoDe(9) = 32 × 2 + 8 × 40 = 384
    expect(svg).toContain('width="384"')
    expect(svg).toContain('height="384"')
  })

  test('las dimensiones se pueden pedir en otro tamaño', () => {
    expect(tableroASvg(tableroVacio(9), 9, null, 960)).toContain('width="960" height="960"')
  })

  test('el <svg> raíz tiene una sola width/height y no queda width="100%"', () => {
    const svg = tableroASvg(tableroVacio(9), 9, null)
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

    const svg = tableroASvg(tablero, 9, null)
    // 5 hoshi + 2 piedras
    expect(svg.match(/<circle/g)).toHaveLength(7)
  })
})
