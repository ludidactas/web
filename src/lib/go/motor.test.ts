import { describe, expect, test } from 'bun:test'
import {
  BLANCO,
  calcularPuntaje,
  calcularTerritorio,
  DAME,
  grupoEn,
  hashTablero,
  jugar,
  JugadaInvalida,
  NEGRO,
  Tablero,
  tableroVacio,
  VACIO,
} from './motor'

/**
 * Tablero 5x5 partido en tres franjas verticales por dos paredes completas (columna 1 negra, columna
 * 3 blanca): la franja izquierda (x=0) solo linda con la pared negra, la del medio (x=2) linda con
 * las dos (dame), y la derecha (x=4) solo con la blanca.
 */
function tableroDeParedes(): Tablero {
  const fila = (): Tablero[number] => [VACIO, NEGRO, VACIO, BLANCO, VACIO]
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
      expect(territorio[y][1]).toBe(VACIO) // hay una piedra, no es territorio
      expect(territorio[y][2]).toBe(DAME) // dame: bordeado por negro y blanco
      expect(territorio[y][3]).toBe(VACIO)
      expect(territorio[y][4]).toBe(BLANCO)
    }
  })

  test('una piedra marcada muerta pasa a ser territorio de quien la rodea', () => {
    // Piedra blanca en (2,2), encerrada por negro en cruz (arriba/abajo/izquierda/derecha).
    const tablero: Tablero = [
      [VACIO, VACIO, VACIO, VACIO, VACIO],
      [VACIO, VACIO, NEGRO, VACIO, VACIO],
      [VACIO, NEGRO, BLANCO, NEGRO, VACIO],
      [VACIO, VACIO, NEGRO, VACIO, VACIO],
      [VACIO, VACIO, VACIO, VACIO, VACIO],
    ]

    const antes = calcularTerritorio(tablero, sinRemovidas(5), 5)
    expect(antes[2][2]).toBe(VACIO) // piedra en pie: no cuenta como territorio

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
    const fila = (): Tablero[number] => [NEGRO, VACIO, NEGRO, VACIO, NEGRO]
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

describe('jugar', () => {
  test('captura un grupo rival que se queda sin libertades', () => {
    // Piedra blanca en (fila 1, columna 1) rodeada por negro en tres lados; el cuarto lado, (fila 2,
    // columna 1), es su última libertad.
    const tablero: Tablero = [
      [VACIO, NEGRO, VACIO],
      [NEGRO, BLANCO, NEGRO],
      [VACIO, VACIO, VACIO],
    ]

    const { tablero: resultado, capturas } = jugar(tablero, 3, 2, 1, NEGRO, new Set())

    expect(capturas).toBe(1)
    expect(resultado[1][1]).toBe(VACIO)
    expect(resultado[2][1]).toBe(NEGRO)
  })

  test('una sola jugada puede capturar más de un grupo rival a la vez', () => {
    // Dos piedras blancas sueltas (no conectadas entre sí) en (1,2) y (3,2), cada una con su única
    // libertad en (2,2). Negro juega ahí y captura ambos grupos.
    const tablero: Tablero = [
      [VACIO, VACIO, VACIO, VACIO, VACIO],
      [VACIO, NEGRO, VACIO, NEGRO, VACIO],
      [NEGRO, BLANCO, VACIO, BLANCO, NEGRO],
      [VACIO, NEGRO, VACIO, NEGRO, VACIO],
      [VACIO, VACIO, VACIO, VACIO, VACIO],
    ]

    const { tablero: resultado, capturas } = jugar(tablero, 5, 2, 2, NEGRO, new Set())

    expect(capturas).toBe(2)
    expect(resultado[2][1]).toBe(VACIO)
    expect(resultado[2][3]).toBe(VACIO)
    expect(resultado[2][2]).toBe(NEGRO)
  })

  test('rechaza una jugada de autocaptura (sin libertades propias y sin capturar nada)', () => {
    // (1,1) rodeado en cruz por piedras negras que a su vez tienen libertades propias en las
    // esquinas: blanco jugando en el centro no captura nada y se queda sin libertades.
    const tablero: Tablero = [
      [VACIO, NEGRO, VACIO],
      [NEGRO, VACIO, NEGRO],
      [VACIO, NEGRO, VACIO],
    ]

    expect(() => jugar(tablero, 3, 1, 1, BLANCO, new Set())).toThrow(JugadaInvalida)
  })

  test('una jugada que capturaría fuera autocaptura en otro caso es legal (se chequea captura antes que autocaptura)', () => {
    // Dos piedras blancas sueltas en (1,0) y (0,1), cada una con su única libertad en la esquina
    // (0,0). Si negro jugara ahí y las libertades se chequearan antes de aplicar la captura, parecería
    // autocaptura (sin libertades propias); pero como las captura, se libera esa misma esquina.
    const tablero: Tablero = [
      [VACIO, BLANCO, NEGRO],
      [BLANCO, NEGRO, VACIO],
      [NEGRO, VACIO, VACIO],
    ]

    const { tablero: resultado, capturas } = jugar(tablero, 3, 0, 0, NEGRO, new Set())

    expect(capturas).toBe(2)
    expect(resultado[0][0]).toBe(NEGRO)
  })

  test('rechaza jugar sobre una posición ocupada', () => {
    const tablero = tableroVacio(3)
    tablero[0][0] = NEGRO

    expect(() => jugar(tablero, 3, 0, 0, BLANCO, new Set())).toThrow(JugadaInvalida)
  })

  test('rechaza coordenadas fuera del tablero', () => {
    const tablero = tableroVacio(3)

    expect(() => jugar(tablero, 3, 3, 0, NEGRO, new Set())).toThrow(JugadaInvalida)
    expect(() => jugar(tablero, 3, -1, 0, NEGRO, new Set())).toThrow(JugadaInvalida)
    expect(() => jugar(tablero, 3, 0, 3, NEGRO, new Set())).toThrow(JugadaInvalida)
  })

  test('rechaza una jugada que repite una posición anterior de la partida (ko/superko)', () => {
    const tablero: Tablero = [
      [VACIO, NEGRO, VACIO],
      [NEGRO, BLANCO, NEGRO],
      [VACIO, VACIO, VACIO],
    ]

    // La posición resultante de esta captura ya "pasó" antes en la partida (queda en el historial).
    const { tablero: posicionRepetida } = jugar(tablero, 3, 2, 1, NEGRO, new Set())
    const historial = new Set([hashTablero(posicionRepetida)])

    expect(() => jugar(tablero, 3, 2, 1, NEGRO, historial)).toThrow(JugadaInvalida)
  })
})
