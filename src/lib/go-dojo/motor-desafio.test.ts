import { describe, expect, test } from 'bun:test'
import { calcularCapturas } from './motor-desafio'
import type { Piedra } from './tipos'

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
