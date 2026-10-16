import { renderToStaticMarkup } from 'react-dom/server'
import { BLANCO, type Color, type Tablero } from './motor'
import { BLANCO_MUERTA, CELDA_PX, MARGEN_PX, TableroGoBase, type EstadoPiedra } from './tablero-go-base'

export function ladoDe(tamaño: number): number {
  return MARGEN_PX * 2 + (tamaño - 1) * CELDA_PX
}

function estadoPiedra(removidas: boolean[][] | null | undefined) {
  return (fila: number, columna: number, valor: Color): EstadoPiedra => {
    const muerta = removidas?.[fila]?.[columna] ?? false
    return {
      opacidad: muerta ? 0.35 : 1,
      fill: muerta && valor === BLANCO ? BLANCO_MUERTA : undefined,
    }
  }
}

/**
 * El tablero como `<svg>` independiente (con `xmlns`), sin DOM: sirve para partidas que no están en
 * pantalla. Mide `px` de lado más `margen` por cada borde, para que asome la sombra del tablero.
 */
export function tableroASvg(
  tablero: Tablero,
  tamaño: number,
  removidas: boolean[][] | null | undefined,
  px = ladoDe(tamaño),
  margen = 0
): string {
  const glowMargen = (margen * ladoDe(tamaño)) / px
  const total = px + 2 * margen
  return renderToStaticMarkup(
    <TableroGoBase tablero={tablero} tamaño={tamaño} glowMargen={glowMargen} estadoPiedra={estadoPiedra(removidas)} />
  )
    .replace('width="100%" height="100%"', `width="${total}" height="${total}"`)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
}
