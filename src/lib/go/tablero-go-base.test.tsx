import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { BLANCO, NEGRO, VACIO, tableroVacio } from './motor'
import { CELDA_PX, MARGEN_PX, TableroGoBase } from './tablero-go-base'

/**
 * `TableroGoBase` es el `<svg>` que dibujan tanto `PartidaGo` como `DesafioDojoGo` — estos tests
 * cubren lo que le es propio a la base (grilla/hoshi/piedras, matemática de click, slots) para no
 * tener que reprobarlo en cada skin. `happy-dom` emula `getScreenCTM()` con una matriz identidad (sin
 * layout real), así que un click en `(clientX, clientY) = coordenadaEnPixeles(...)` cae exacto en la
 * intersección esperada — ver `puntoEn` abajo.
 */

afterEach(cleanup)

function puntoEn(fila: number, columna: number) {
  return { clientX: MARGEN_PX + columna * CELDA_PX, clientY: MARGEN_PX + fila * CELDA_PX }
}

describe('grilla y piedras', () => {
  test('dibuja tamaño*2 líneas de grilla y 5 hoshi para un tablero de 9', () => {
    const { container } = render(<TableroGoBase tablero={tableroVacio(9)} tamaño={9} />)
    expect(container.querySelectorAll('line')).toHaveLength(18)
    // Los hoshi son <circle> hijos directos del <svg>; las piedras (ninguna acá) viven anidadas
    // dentro de un <g> de sombra, así que este selector no las confunde con hoshi.
    expect(container.querySelectorAll('svg > circle')).toHaveLength(5)
  })

  test('dibuja exactamente una piedra por casilla ocupada, con el relleno de su color', () => {
    const tablero = tableroVacio(5)
    tablero[1][2] = NEGRO
    tablero[3][4] = BLANCO

    const { container } = render(<TableroGoBase tablero={tablero} tamaño={5} />)
    const piedras = container.querySelectorAll('svg > g > g > circle')
    expect(piedras).toHaveLength(2)

    const rellenos = [...piedras].map((c) => c.getAttribute('fill'))
    expect(rellenos.some((f) => f?.includes('piedra-negra'))).toBe(true)
    expect(rellenos.some((f) => f?.includes('piedra-blanca'))).toBe(true)
  })

  test('ariaLabel queda como accessible name del tablero', () => {
    render(<TableroGoBase tablero={tableroVacio(5)} tamaño={5} ariaLabel="Tablero de prueba" />)
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe('Tablero de prueba')
  })
})

describe('clicks', () => {
  test('click en un punto vacío llama a onPointClick con (fila, columna)', () => {
    const onPointClick = mock()
    const { container } = render(<TableroGoBase tablero={tableroVacio(9)} tamaño={9} onPointClick={onPointClick} />)

    fireEvent.click(container.querySelector('svg')!, puntoEn(4, 6))

    expect(onPointClick).toHaveBeenCalledTimes(1)
    expect(onPointClick).toHaveBeenCalledWith(4, 6)
  })

  test('click en un punto ocupado no llama a onPointClick (default: solo se puede jugar en vacío)', () => {
    const tablero = tableroVacio(9)
    tablero[4][6] = NEGRO
    const onPointClick = mock()
    const { container } = render(<TableroGoBase tablero={tablero} tamaño={9} onPointClick={onPointClick} />)

    fireEvent.click(container.querySelector('svg')!, puntoEn(4, 6))

    expect(onPointClick).not.toHaveBeenCalled()
  })

  test('disabled ignora los clicks aunque el punto sea válido', () => {
    const onPointClick = mock()
    const { container } = render(
      <TableroGoBase tablero={tableroVacio(9)} tamaño={9} onPointClick={onPointClick} disabled />
    )

    fireEvent.click(container.querySelector('svg')!, puntoEn(0, 0))

    expect(onPointClick).not.toHaveBeenCalled()
  })

  test('esSeleccionable custom reemplaza la regla default (ej. conteo: solo piedras vivas)', () => {
    const tablero = tableroVacio(9)
    tablero[4][6] = NEGRO
    const onPointClick = mock()
    const { container } = render(
      <TableroGoBase
        tablero={tablero}
        tamaño={9}
        onPointClick={onPointClick}
        esSeleccionable={(fila, columna) => tablero[fila][columna] !== VACIO}
      />
    )

    fireEvent.click(container.querySelector('svg')!, puntoEn(4, 6))
    expect(onPointClick).toHaveBeenCalledWith(4, 6)

    fireEvent.click(container.querySelector('svg')!, puntoEn(0, 0))
    expect(onPointClick).toHaveBeenCalledTimes(1)
  })

  test('mousemove reporta el punto por onHoverChange, y null al salir del tablero', () => {
    const onHoverChange = mock()
    const { container } = render(
      <TableroGoBase tablero={tableroVacio(9)} tamaño={9} onPointClick={() => {}} onHoverChange={onHoverChange} />
    )
    const svg = container.querySelector('svg')!

    fireEvent.mouseMove(svg, puntoEn(2, 5))
    expect(onHoverChange).toHaveBeenLastCalledWith([2, 5])

    fireEvent.mouseLeave(svg)
    expect(onHoverChange).toHaveBeenLastCalledWith(null)
  })
})

describe('slots y decoración por piedra', () => {
  test('estadoPiedra controla título y decoración de una piedra puntual', () => {
    const tablero = tableroVacio(3)
    tablero[1][1] = NEGRO

    const { container } = render(
      <TableroGoBase
        tablero={tablero}
        tamaño={3}
        estadoPiedra={(fila, columna) =>
          fila === 1 && columna === 1
            ? { titulo: 'Grupo vivo', decoracion: <text data-testid="deco">D</text> }
            : {}
        }
      />
    )

    expect(container.querySelector('title')?.textContent).toBe('Grupo vivo')
    expect(container.querySelector('[data-testid="deco"]')).toBeTruthy()
  })

  test('beforeStones/afterStones (función) reciben lado/piezaFill/filtroSombraUrl del tablero', () => {
    const tamaño = 9
    const ladoEsperado = CELDA_PX * (tamaño - 1) + MARGEN_PX * 2

    const { container } = render(
      <TableroGoBase
        tablero={tableroVacio(tamaño)}
        tamaño={tamaño}
        afterStones={({ lado, piezaFill, filtroSombraUrl }) => (
          <rect
            data-testid="after"
            width={lado}
            fill={piezaFill(NEGRO)}
            filter={filtroSombraUrl}
          />
        )}
      />
    )

    const rect = container.querySelector('[data-testid="after"]')!
    expect(Number(rect.getAttribute('width'))).toBe(ladoEsperado)
    expect(rect.getAttribute('fill')).toContain('piedra-negra')
    expect(rect.getAttribute('filter')).toContain('sombra-piedra')
  })
})
