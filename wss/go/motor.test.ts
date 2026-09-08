import { describe, expect, test } from 'bun:test'
import { BLANCO, calcularPuntaje, calcularTerritorio, grupoEn, NEGRO, Tablero } from './motor'

/**
 * Tablero 5x5 partido en tres franjas verticales por dos paredes completas (columna 1 negra, columna
 * 3 blanca): la franja izquierda (x=0) solo linda con la pared negra, la del medio (x=2) linda con
 * las dos (dame), y la derecha (x=4) solo con la blanca.
 */
function tableroDeParedes(): Tablero {
  const fila = (): number[] => [0, NEGRO, 0, BLANCO, 0]
  return Array.from({ length: 5 }, fila)
}

function sinRemovidas(tamaño: number): boolean[][] {
  return Array.from({ length: tamaño }, () => Array(tamaño).fill(false))
}

describe('calcularTerritorio', () => {
  test('asigna cada franja a quien la bordea, y neutraliza (dame) la que bordean ambos colores', () => {
    const territorio = calcularTerritorio(tableroDeParedes(), sinRemovidas(5), 5)

    for (let y = 0; y < 5; y++) {
      expect(territorio[y][0]).toBe(NEGRO)
      expect(territorio[y][1]).toBe(0) // hay una piedra, no es territorio
      expect(territorio[y][2]).toBe(3) // dame: bordeado por negro y blanco
      expect(territorio[y][3]).toBe(0)
      expect(territorio[y][4]).toBe(BLANCO)
    }
  })

  test('una piedra marcada muerta pasa a ser territorio de quien la rodea', () => {
    // Piedra blanca en (2,2), encerrada por negro en cruz (arriba/abajo/izquierda/derecha).
    const tablero: Tablero = [
      [0, 0, 0, 0, 0],
      [0, 0, NEGRO, 0, 0],
      [0, NEGRO, BLANCO, NEGRO, 0],
      [0, 0, NEGRO, 0, 0],
      [0, 0, 0, 0, 0],
    ]

    const antes = calcularTerritorio(tablero, sinRemovidas(5), 5)
    expect(antes[2][2]).toBe(0) // piedra en pie: no cuenta como territorio

    const removidas = sinRemovidas(5)
    removidas[2][2] = true
    const después = calcularTerritorio(tablero, removidas, 5)
    expect(después[2][2]).toBe(NEGRO)
  })
})

describe('calcularPuntaje', () => {
  test('territorio menos capturas del rival, más komi para blanco', () => {
    const puntaje = calcularPuntaje(tableroDeParedes(), 5, sinRemovidas(5), 0, 0)
    // tamaño=5 no tiene komi propio en KOMI_POR_TAMAÑO, así que cae al default de 7.5.
    expect(puntaje).toEqual({ negro: 5, blanco: 12.5, ganador: 'blanco' })
  })

  test('las capturas del rival restan al propio puntaje', () => {
    const conCapturas = calcularPuntaje(tableroDeParedes(), 5, sinRemovidas(5), 0, 3)
    expect(conCapturas.negro).toBe(5 - 3)
  })

  test('negro puede ganar pese al komi si su ventaja de territorio lo supera', () => {
    // Tres paredes negras (columnas 0, 2, 4) encierran dos franjas de territorio negro (columnas 1 y
    // 3); no hay blanco en el tablero, así que su puntaje es puro komi.
    const fila = () => [NEGRO, 0, NEGRO, 0, NEGRO]
    const tablero: Tablero = Array.from({ length: 5 }, fila)

    const puntaje = calcularPuntaje(tablero, 5, sinRemovidas(5), 0, 0)
    expect(puntaje).toEqual({ negro: 10, blanco: 7.5, ganador: 'negro' })
  })
})

describe('grupoEn', () => {
  test('coordenadas fuera del tablero no rompen: devuelve grupo vacío', () => {
    const tablero = tableroDeParedes()
    expect(grupoEn(tablero, -1, 0, 5)).toEqual([])
    expect(grupoEn(tablero, 0, 999, 5)).toEqual([])
    expect(grupoEn(tablero, 100, 100, 5)).toEqual([])
  })
})
