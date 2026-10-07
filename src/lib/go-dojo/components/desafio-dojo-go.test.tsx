import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { NEGRO } from '@/lib/go/motor'
import { CELDA_PX, MARGEN_PX } from '@/lib/go/tablero-go-base'
import { DesafioDojoGo } from './desafio-dojo-go'
import type { Piedra } from '../tipos'

/**
 * `DesafioDojoGo` habla en `(fila, columna)` de punta a punta (sin la traducción a `{x,y}` que sí
 * tiene `PartidaGo`) — estos tests verifican eso además de lo que le es propio: marks de anotación,
 * anillos de jugada correcta, y el triángulo sobre la piedra recién jugada.
 */

afterEach(cleanup)

function puntoEn(fila: number, columna: number) {
  return { clientX: MARGEN_PX + columna * CELDA_PX, clientY: MARGEN_PX + fila * CELDA_PX }
}

function svgDe(container: HTMLElement) {
  return container.querySelector('svg')!
}

describe('clicks', () => {
  test('onPointClick recibe (r, c) tal cual, sin invertir', () => {
    const onPointClick = mock()
    const { container } = render(<DesafioDojoGo boardSize={9} stones={[]} onPointClick={onPointClick} />)

    fireEvent.click(svgDe(container), puntoEn(2, 5))

    expect(onPointClick).toHaveBeenCalledWith(2, 5)
  })

  test('un punto ocupado no dispara onPointClick', () => {
    const stones: Piedra[] = [{ r: 2, c: 5, color: 'N' }]
    const onPointClick = mock()
    const { container } = render(<DesafioDojoGo boardSize={9} stones={stones} onPointClick={onPointClick} />)

    fireEvent.click(svgDe(container), puntoEn(2, 5))

    expect(onPointClick).not.toHaveBeenCalled()
  })

  test('disabled ignora los clicks', () => {
    const onPointClick = mock()
    const { container } = render(
      <DesafioDojoGo boardSize={9} stones={[]} onPointClick={onPointClick} disabled />
    )

    fireEvent.click(svgDe(container), puntoEn(0, 0))

    expect(onPointClick).not.toHaveBeenCalled()
  })
})

describe('decoraciones propias del dojo', () => {
  test('marks tipo "letra" renderiza el texto en el punto indicado', () => {
    const { container } = render(
      <DesafioDojoGo boardSize={9} stones={[]} marks={[{ r: 0, c: 1, tipo: 'letra', texto: 'A' }]} />
    )
    const texto = container.querySelector('text')
    expect(texto?.textContent).toBe('A')
    expect(Number(texto!.getAttribute('x'))).toBe(MARGEN_PX + 1 * CELDA_PX)
    expect(Number(texto!.getAttribute('y'))).toBe(MARGEN_PX + 0 * CELDA_PX)
  })

  test('correctMoveMarkers dibuja un anillo verde en cada punto listado', () => {
    const { container } = render(
      <DesafioDojoGo boardSize={9} stones={[]} correctMoveMarkers={[[3, 4]]} />
    )
    const anillo = container.querySelector('circle[stroke="#2e7d32"]')
    expect(anillo).toBeTruthy()
    expect(Number(anillo!.getAttribute('cx'))).toBe(MARGEN_PX + 4 * CELDA_PX)
    expect(Number(anillo!.getAttribute('cy'))).toBe(MARGEN_PX + 3 * CELDA_PX)
  })

  test('playedPoint decora esa piedra con un triángulo (<path>)', () => {
    const stones: Piedra[] = [{ r: 2, c: 2, color: 'N' }]
    const { container } = render(
      <DesafioDojoGo boardSize={9} stones={stones} playedPoint={[2, 2]} />
    )
    expect(container.querySelector('path')).toBeTruthy()
  })

  test('ghost dibuja un marcador translúcido en el punto de ayuda', () => {
    const { container } = render(<DesafioDojoGo boardSize={9} stones={[]} ghost={[1, 1]} />)
    const ghost = container.querySelector('circle[fill="rgba(192,57,43,0.35)"]')
    expect(ghost).toBeTruthy()
  })

  test('con nextMoveColor, el hover sobre un punto vacío previsualiza una piedra de ese color', () => {
    const { container } = render(
      <DesafioDojoGo boardSize={9} stones={[]} nextMoveColor={NEGRO} onPointClick={() => {}} />
    )

    fireEvent.mouseMove(svgDe(container), puntoEn(4, 4))

    const preview = container.querySelector('circle[fill*="piedra-negra"][opacity="0.4"]')
    expect(preview).toBeTruthy()
  })
})
