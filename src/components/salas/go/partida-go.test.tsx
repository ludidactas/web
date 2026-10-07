import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { BLANCO, NEGRO, tableroVacio, type Tablero } from '@/lib/go/motor'
import { CELDA_PX, MARGEN_PX, RELLENO } from '@/lib/go/tablero-go-base'
import { PartidaGo } from './partida-go'

/**
 * `PartidaGo` habla en `(fila, columna)` de punta a punta — igual que `TableroGoBase`, el motor y el
 * protocolo de red (`jugadaSchema`, `Partida.ultimaJugada`). El primer test cubre exactamente eso: que
 * `onJugar` recibe `(fila, columna)` sin ninguna conversión de por medio.
 */

afterEach(cleanup)

function puntoEn(fila: number, columna: number) {
  return { clientX: MARGEN_PX + columna * CELDA_PX, clientY: MARGEN_PX + fila * CELDA_PX }
}

function svgDe(container: HTMLElement) {
  return container.querySelector('svg')!
}

describe('coordenadas y clicks', () => {
  test('onJugar recibe (fila, columna), sin swap', () => {
    const onJugar = mock()
    const { container } = render(<PartidaGo tablero={tableroVacio(9)} tamaño={9} onJugar={onJugar} />)

    fireEvent.click(svgDe(container), puntoEn(4, 6))

    expect(onJugar).toHaveBeenCalledWith(4, 6)
  })

  test('en juego normal, un punto ocupado no dispara onJugar', () => {
    const tablero = tableroVacio(9)
    tablero[4][6] = NEGRO
    const onJugar = mock()
    const { container } = render(<PartidaGo tablero={tablero} tamaño={9} onJugar={onJugar} />)

    fireEvent.click(svgDe(container), puntoEn(4, 6))

    expect(onJugar).not.toHaveBeenCalled()
  })

  test('deshabilitado ignora los clicks', () => {
    const onJugar = mock()
    const { container } = render(<PartidaGo tablero={tableroVacio(9)} tamaño={9} onJugar={onJugar} deshabilitado />)

    fireEvent.click(svgDe(container), puntoEn(0, 0))

    expect(onJugar).not.toHaveBeenCalled()
  })
})

describe('modoConteo: seleccionable es al revés que en juego normal', () => {
  function tableroConGrupo(): Tablero {
    const tablero = tableroVacio(9)
    tablero[4][6] = BLANCO
    return tablero
  }

  test('un punto vacío no se puede marcar (nada que marcar)', () => {
    const onJugar = mock()
    const { container } = render(
      <PartidaGo tablero={tableroConGrupo()} tamaño={9} modoConteo onJugar={onJugar} />
    )

    fireEvent.click(svgDe(container), puntoEn(0, 0))

    expect(onJugar).not.toHaveBeenCalled()
  })

  test('una piedra en pie sí se puede marcar como muerta', () => {
    const onJugar = mock()
    const { container } = render(
      <PartidaGo tablero={tableroConGrupo()} tamaño={9} modoConteo onJugar={onJugar} />
    )

    fireEvent.click(svgDe(container), puntoEn(4, 6))

    expect(onJugar).toHaveBeenCalledWith(4, 6)
  })

  test('una piedra incondicionalmente viva (Benson) no se puede marcar', () => {
    const vivo = Array.from({ length: 9 }, () => Array(9).fill(false))
    vivo[4][6] = true
    const onJugar = mock()
    const { container } = render(
      <PartidaGo tablero={tableroConGrupo()} tamaño={9} modoConteo vivo={vivo} onJugar={onJugar} />
    )

    fireEvent.click(svgDe(container), puntoEn(4, 6))

    expect(onJugar).not.toHaveBeenCalled()
  })
})

describe('decoraciones propias de la partida (no las tiene TableroGoBase)', () => {
  test('turno dibuja el glow del color correspondiente; sin turno, no hay glow', () => {
    const { container, rerender } = render(<PartidaGo tablero={tableroVacio(9)} tamaño={9} turno={NEGRO} />)
    const glow = container.querySelector(`rect[fill="${RELLENO[NEGRO]}"]`)
    expect(glow).toBeTruthy()

    rerender(<PartidaGo tablero={tableroVacio(9)} tamaño={9} />)
    expect(container.querySelector(`rect[fill="${RELLENO[NEGRO]}"]`)).toBeNull()
    expect(container.querySelector(`rect[fill="${RELLENO[BLANCO]}"]`)).toBeNull()
  })

  test('ultimaJugada dibuja un anillo en esa intersección', () => {
    const { container } = render(
      <PartidaGo tablero={tableroVacio(9)} tamaño={9} ultimaJugada={{ fila: 4, columna: 6 }} />
    )
    const anillo = container.querySelector('.stroke-ld-amarillo-oscuro')
    expect(anillo).toBeTruthy()
    expect(Number(anillo!.getAttribute('cx'))).toBe(MARGEN_PX + 6 * CELDA_PX)
    expect(Number(anillo!.getAttribute('cy'))).toBe(MARGEN_PX + 4 * CELDA_PX)
  })

  test('con miColor seteado, el hover sobre un punto vacío muestra el ghost de la próxima jugada', () => {
    const { container } = render(<PartidaGo tablero={tableroVacio(9)} tamaño={9} miColor={NEGRO} onJugar={() => {}} />)

    fireEvent.mouseMove(svgDe(container), puntoEn(2, 3))

    const ghost = container.querySelector('circle[fill*="piedra-negra"][opacity="0.4"]')
    expect(ghost).toBeTruthy()
  })
})
