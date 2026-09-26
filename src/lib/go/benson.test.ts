import { describe, expect, test } from 'bun:test'
import { calcularVivos } from './benson'
import { BLANCO, NEGRO, VACIO, type Tablero } from './motor'

describe('calcularVivos', () => {
  test('una cadena con dos ojos propios en la esquina queda marcada como incondicionalmente viva', () => {
    // Esquina superior izquierda: pared negra conectada que encierra dos ojos de un punto cada uno,
    // en (fila 0, col 0) y (fila 0, col 2). El resto del tablero queda vacío.
    const tablero: Tablero = [
      [VACIO, NEGRO, VACIO, NEGRO],
      [NEGRO, NEGRO, NEGRO, NEGRO],
      [VACIO, VACIO, VACIO, VACIO],
      [VACIO, VACIO, VACIO, VACIO],
    ]

    const vivo = calcularVivos(tablero, 4)

    expect(vivo[0][1]).toBe(true)
    expect(vivo[0][3]).toBe(true)
    expect(vivo[1][0]).toBe(true)
    expect(vivo[1][1]).toBe(true)
    expect(vivo[1][2]).toBe(true)
    expect(vivo[1][3]).toBe(true)
    // Los ojos son puntos vacíos, no piedras: nunca se marcan vivos.
    expect(vivo[0][0]).toBe(false)
    expect(vivo[0][2]).toBe(false)
  })

  test('una cadena con un solo ojo real no queda marcada como viva', () => {
    // Mismo grupo que el test anterior, pero sin la piedra en (fila 1, col 3): el segundo "ojo" se
    // abre hacia el resto del tablero y deja de ser una región vital — solo queda un ojo real, y
    // Benson exige dos.
    const tablero: Tablero = [
      [VACIO, NEGRO, VACIO, VACIO],
      [NEGRO, NEGRO, NEGRO, VACIO],
      [VACIO, VACIO, VACIO, VACIO],
      [VACIO, VACIO, VACIO, VACIO],
    ]

    const vivo = calcularVivos(tablero, 4)

    expect(vivo[0][1]).toBe(false)
    expect(vivo[1][0]).toBe(false)
    expect(vivo[1][1]).toBe(false)
    expect(vivo[1][2]).toBe(false)
  })

  test('cada color se evalúa por separado: una piedra suelta sin ojos no vive aunque el rival sí', () => {
    const tablero: Tablero = [
      [VACIO, NEGRO, VACIO, NEGRO, VACIO],
      [NEGRO, NEGRO, NEGRO, NEGRO, VACIO],
      [VACIO, VACIO, VACIO, VACIO, VACIO],
      [VACIO, VACIO, VACIO, VACIO, BLANCO],
      [VACIO, VACIO, VACIO, VACIO, VACIO],
    ]

    const vivo = calcularVivos(tablero, 5)

    expect(vivo[0][1]).toBe(true)
    expect(vivo[0][3]).toBe(true)
    expect(vivo[3][4]).toBe(false)
  })

  test('un tablero vacío no marca nada como vivo', () => {
    const tablero: Tablero = [
      [VACIO, VACIO],
      [VACIO, VACIO],
    ]

    expect(calcularVivos(tablero, 2)).toEqual([
      [false, false],
      [false, false],
    ])
  })
})
