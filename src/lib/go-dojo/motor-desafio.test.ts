import { describe, expect, test } from 'bun:test'
import { calcularCapturas, regionDeDesafio } from './motor-desafio'
import { DesafioSchema, type Desafio, type Piedra } from './tipos'

// calcularCapturas delega en el motor compartido (src/lib/go/motor.ts), que habla en la misma
// convención (fila, columna). Estos tests usan posiciones a propósito asimétricas (fila != columna)
// para que una futura transposición accidental (fila<->columna en algún punto de la delegación) se
// vea como una clave transpuesta y falle, en vez de pasar de casualidad como en una posición simétrica.
describe('calcularCapturas — orientación fila/columna', () => {
  test('captura una piedra sola en una posición asimétrica', () => {
    // Blanca en (fila=2, col=5), rodeada en tres lados por negras; falta (2,6) para capturarla.
    const piedras: Piedra[] = [
      { r: 2, c: 5, color: 'B' },
      { r: 1, c: 5, color: 'N' },
      { r: 3, c: 5, color: 'N' },
      { r: 2, c: 4, color: 'N' },
    ]
    const capturadas = calcularCapturas(piedras, 2, 6, 'N', 9)
    expect(capturadas).toEqual(new Set(['2,5']))
  })

  test('captura un grupo de dos piedras conectadas en una posición asimétrica', () => {
    // Dos blancas conectadas en (1,6) y (1,7) (misma fila, columnas distintas), rodeadas salvo por
    // (1,8) — jugar ahí captura a las dos.
    const piedras: Piedra[] = [
      { r: 1, c: 6, color: 'B' },
      { r: 1, c: 7, color: 'B' },
      { r: 0, c: 6, color: 'N' },
      { r: 0, c: 7, color: 'N' },
      { r: 2, c: 6, color: 'N' },
      { r: 2, c: 7, color: 'N' },
      { r: 1, c: 5, color: 'N' },
    ]
    const capturadas = calcularCapturas(piedras, 1, 8, 'N', 9)
    expect(capturadas).toEqual(new Set(['1,6', '1,7']))
  })
})

describe('regionDeDesafio', () => {
  const desafio = (extra: Record<string, unknown>): Desafio =>
    DesafioSchema.parse({
      id: 'x',
      titulo: 'x',
      tamañoTablero: 19,
      jugadasCorrectas: [[1, 1]],
      explicacion: 'x',
      ...extra,
    })

  test('recorta a una ventana cuadrada pegada al borde cuando todo está en una esquina', () => {
    const d = desafio({ piedras: [{ r: 1, c: 2, color: 'N' }, { r: 3, c: 4, color: 'B' }] })
    expect(regionDeDesafio(d)).toEqual({ filaMin: 0, filaMax: 8, columnaMin: 0, columnaMax: 8 })
  })

  test('contiene las jugadas correctas y las ramas de la secuencia aunque estén lejos de las piedras', () => {
    const d = desafio({
      piedras: [{ r: 2, c: 2, color: 'N' }],
      jugadasCorrectas: undefined,
      tipo: 'secuencia',
      secuencia: { ramas: [{ en: [2, 9], correcto: true, texto: 'ok', respuestaRival: [8, 3] }] },
    })
    const r = regionDeDesafio(d)!
    expect(r.filaMax).toBeGreaterThanOrEqual(8)
    expect(r.columnaMax).toBeGreaterThanOrEqual(9)
    expect(r.filaMax - r.filaMin).toBe(r.columnaMax - r.columnaMin)
  })

  test('no recorta cuando la ventana cubriría casi todo el tablero', () => {
    expect(regionDeDesafio(desafio({ tamañoTablero: 9, piedras: [{ r: 4, c: 4, color: 'N' }] }))).toBeNull()
  })

  test('no se sale del tablero con piedras en la esquina opuesta', () => {
    const r = regionDeDesafio(desafio({ piedras: [{ r: 17, c: 17, color: 'N' }], jugadasCorrectas: [[18, 18]] }))!
    expect(r.filaMax).toBe(18)
    expect(r.columnaMax).toBe(18)
  })
})
