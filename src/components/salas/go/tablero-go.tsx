'use client'

import { useOutlineFilter } from '@/components/fx/filtros'
import { BLANCO, calcularPuntaje, calcularTerritorio, grupoEn, NEGRO } from '@/wss/go/motor'
import { useMemo, useRef, useState } from 'react'

export { BLANCO, calcularPuntaje, NEGRO }

const CELDA = 40
const MARGEN = 32
/** Margen extra alrededor del tablero, solo para que el halo del contorno del turno tenga dónde
 * asomar sin que lo recorte el propio `viewBox` del `<svg>` (que si no, queda pegado al borde). */
const GLOW_MARGEN = 10

/** Color de relleno de cada piedra. Exportado para que otros componentes (ej. el indicador de
 * turno) usen la misma paleta que el tablero en vez de repetir los hex a mano. */
export const RELLENO: Record<number, string> = { [NEGRO]: '#1a1a1a', [BLANCO]: '#f5f5f5' }

interface Punto {
  x: number
  y: number
}

/** Puntos de referencia (hoshi) según el tamaño estándar del tablero. */
function puntosEstrella(tamaño: number): Punto[] {
  if (tamaño === 9) {
    const b = [2, 6]
    return [...b.flatMap((x) => b.map((y) => ({ x, y }))), { x: 4, y: 4 }]
  }
  if (tamaño === 13) {
    const b = [3, 9]
    return [...b.flatMap((x) => b.map((y) => ({ x, y }))), { x: 6, y: 6 }]
  }
  if (tamaño === 19) {
    const p = [3, 9, 15]
    return p.flatMap((x) => p.map((y) => ({ x, y })))
  }
  return []
}

/**
 * Tablero de Go dibujado a mano en SVG. Recibe el mismo formato de matriz que usa el motor del
 * servidor (0 vacío, 1 negro, 2 blanco), así que no hace falta traducir nada entre server y UI.
 */
export function TableroGo({
  tablero,
  tamaño,
  removidas,
  vivo,
  modoConteo,
  miColor,
  turno,
  esMiTurno,
  deshabilitado,
  onJugar,
}: {
  tablero: number[][]
  tamaño: number
  /** Piedras marcadas como muertas durante la fase de conteo (se muestran atenuadas). */
  removidas?: boolean[][] | null
  /** Puntos de cadenas incondicionalmente vivas (algoritmo de Benson): no se pueden marcar como muertas. */
  vivo?: boolean[][] | null
  /** Fase de conteo: grisa los grupos vivos (no seleccionables) y resalta el grupo bajo el cursor. */
  modoConteo?: boolean
  /** Color con el que jugaría el usuario (1 negro, 2 blanco): habilita el ghost de la próxima jugada. */
  miColor?: 1 | 2
  /** De quién es el turno (1 negro, 2 blanco): agrega un contorno del tablero de ese color. */
  turno?: 1 | 2
  /** Si el turno es del usuario, el contorno del tablero pulsa para que note que le toca jugar. */
  esMiTurno?: boolean
  deshabilitado?: boolean
  onJugar?: (x: number, y: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<Punto | null>(null)
  const lado = CELDA * (tamaño - 1) + MARGEN * 2
  // El viewBox es más grande que el contenido (que sigue viviendo en 0..lado, sin tocar ninguna
  // coordenada existente): el margen extra queda afuera, disponible para el halo del glow.
  const viewBoxLado = lado + GLOW_MARGEN * 2

  // Dos filtros de contorno fijo (no `currentColor`: el <feFlood> vive en un <svg> separado del
  // elemento que referencia el filtro, así que no hereda el `color` de ese elemento). Elegimos cuál
  // aplicar según el color del grupo, para que el contorno siempre sea el opuesto (negro <-> blanco).
  const contornoNegro = useOutlineFilter({ outlineColor: RELLENO[NEGRO], radius: 3 })
  const contornoBlanco = useOutlineFilter({ outlineColor: RELLENO[BLANCO], radius: 3 })

  function coordenadas(x: number) {
    return MARGEN + x * CELDA
  }

  function puntoDesdeEvento(e: React.MouseEvent<SVGSVGElement>): Punto | null {
    const svg = svgRef.current
    if (!svg) return null

    // Usamos la matriz de transformación real del SVG en vez de recalcular a mano el escalado del
    // viewBox a partir de `getBoundingClientRect`: esa cuenta manual asume que el elemento renderiza
    // perfectamente cuadrado (ancho == alto), y si el layout le da menos alto que ancho (o viceversa)
    // el cálculo se desalinea — más notorio lejos del centro. `getScreenCTM` refleja el escalado (y
    // cualquier letterboxing de `preserveAspectRatio`) que el browser aplicó de verdad.
    const ctm = svg.getScreenCTM()
    if (!ctm) return null

    const puntoPantalla = svg.createSVGPoint()
    puntoPantalla.x = e.clientX
    puntoPantalla.y = e.clientY
    const { x: localX, y: localY } = puntoPantalla.matrixTransform(ctm.inverse())

    const x = Math.round((localX - MARGEN) / CELDA)
    const y = Math.round((localY - MARGEN) / CELDA)

    if (x < 0 || x >= tamaño || y < 0 || y >= tamaño) return null
    return { x, y }
  }

  function esSeleccionable(p: Punto) {
    if (modoConteo) return tablero[p.y][p.x] !== 0 && !(vivo?.[p.y][p.x] ?? false)
    return tablero[p.y][p.x] === 0
  }

  function manejarClick(e: React.MouseEvent<SVGSVGElement>) {
    if (deshabilitado || !onJugar) return
    const punto = puntoDesdeEvento(e)
    if (!punto || !esSeleccionable(punto)) return
    onJugar(punto.x, punto.y)
  }

  function manejarMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (deshabilitado || !onJugar) return setHover(null)
    setHover(puntoDesdeEvento(e))
  }

  const grupoHover = useMemo(() => {
    if (!modoConteo || !hover || !esSeleccionable(hover)) return []
    return grupoEn(tablero, hover.x, hover.y, tamaño)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoConteo, hover, tablero, tamaño, vivo])

  const territorio = useMemo(
    () => (modoConteo ? calcularTerritorio(tablero, removidas, tamaño) : null),
    [modoConteo, tablero, removidas, tamaño]
  )

  const colorGrupoHover = grupoHover.length > 0 ? tablero[grupoHover[0][1]][grupoHover[0][0]] : null
  // El contorno es el opuesto al color del grupo (grupo negro -> contorno blanco, y viceversa).
  const filterUrlHover = colorGrupoHover === NEGRO ? contornoBlanco.filterUrl : contornoNegro.filterUrl

  // Contorno del tablero: acá sí es el MISMO color que el turno (blanco juega -> contorno blanco),
  // porque no estamos resaltando una piedra contra sí misma sino indicando de quién es el turno.
  const filterUrlTurno = turno === NEGRO ? contornoNegro.filterUrl : contornoBlanco.filterUrl

  // Ghost de la próxima jugada: previsualiza la piedra en la intersección vacía bajo el cursor.
  const mostrarGhost = !modoConteo && !!miColor && !!hover && tablero[hover.y][hover.x] === 0

  const cursorActual =
    deshabilitado || !onJugar || (hover && !esSeleccionable(hover)) || (modoConteo && !hover) ? 'default' : 'pointer'

  return (
    <svg
      ref={svgRef}
      viewBox={`${-GLOW_MARGEN} ${-GLOW_MARGEN} ${viewBoxLado} ${viewBoxLado}`}
      width="100%"
      height="100%"
      className="max-w-[min(90vw,560px)] max-h-[min(70vh,560px)] aspect-square touch-none select-none"
      style={{ cursor: cursorActual }}
      onClick={manejarClick}
      onMouseMove={manejarMouseMove}
      onMouseLeave={() => setHover(null)}
    >
      {contornoNegro.defs}
      {contornoBlanco.defs}

      {/* Glow del turno: un rect idéntico al fondo, pero atrás — solo se ve el halo dilatado que
          asoma por los bordes. Va en una capa separada del tablero real para que, si pulsa, pulse
          solo el halo y no todo el contenido del tablero. */}
      {turno && (
        <g filter={filterUrlTurno} className={esMiTurno ? 'animate-pulse' : undefined}>
          <rect x={0} y={0} width={lado} height={lado} rx={8} fill={RELLENO[turno]} />
        </g>
      )}

      <rect x={0} y={0} width={lado} height={lado} fill="#dcb35c" rx={8} />

      {/* Líneas de la grilla */}
      {Array.from({ length: tamaño }, (_, i) => (
        <line
          key={`h${i}`}
          x1={coordenadas(0)}
          y1={coordenadas(i)}
          x2={coordenadas(tamaño - 1)}
          y2={coordenadas(i)}
          stroke="#3f2d12"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: tamaño }, (_, i) => (
        <line
          key={`v${i}`}
          x1={coordenadas(i)}
          y1={coordenadas(0)}
          x2={coordenadas(i)}
          y2={coordenadas(tamaño - 1)}
          stroke="#3f2d12"
          strokeWidth={1}
        />
      ))}

      {/* Puntos de referencia (hoshi) */}
      {puntosEstrella(tamaño).map(({ x, y }) => (
        <circle key={`hoshi-${x},${y}`} cx={coordenadas(x)} cy={coordenadas(y)} r={3} fill="#3f2d12" />
      ))}

      {/* Hint de territorio: si se confirma el conteo tal como está marcado ahora, de quién sería
          cada punto vacío (flood-fill). Va debajo de las piedras: en las marcadas como muertas, el
          tinte se asoma a través de su propia opacidad reducida. */}
      {territorio &&
        territorio.map((fila, y) =>
          fila.map((color, x) => {
            if (color === 0 || color === 3) return null
            return (
              <rect
                key={`terr-${x},${y}`}
                x={coordenadas(x) - CELDA * 0.32}
                y={coordenadas(y) - CELDA * 0.32}
                width={CELDA * 0.64}
                height={CELDA * 0.64}
                fill={RELLENO[color]}
                opacity={0.3}
                pointerEvents="none"
              />
            )
          })
        )}

      {/* Resalte del grupo bajo el cursor durante el conteo — contorno del color opuesto al grupo. */}
      {grupoHover.length > 0 && colorGrupoHover && (
        <g filter={filterUrlHover}>
          {grupoHover.map(([x, y]) => (
            <circle
              key={`hover-${x},${y}`}
              cx={coordenadas(x)}
              cy={coordenadas(y)}
              r={CELDA * 0.46}
              fill={RELLENO[colorGrupoHover]}
            />
          ))}
        </g>
      )}

      {/* Piedras */}
      {tablero.map((fila, y) =>
        fila.map((valor, x) => {
          if (valor === 0) return null

          const muerta = removidas?.[y]?.[x] ?? false
          const esVivo = vivo?.[y]?.[x] ?? false
          const hovereada = grupoHover.some(([gx, gy]) => gx === x && gy === y)
          const opacidad = esVivo ? 0.85 : muerta ? (hovereada ? 0.7 : 0.35) : 1

          return (
            <circle
              key={`${x},${y}`}
              cx={coordenadas(x)}
              cy={coordenadas(y)}
              r={CELDA * 0.46}
              fill={RELLENO[valor]}
              stroke="#1a1a1a"
              strokeWidth={valor === NEGRO ? 0 : 1}
              opacity={opacidad}
              style={esVivo ? { filter: 'grayscale(1)' } : undefined}
            >
              <title>{esVivo ? 'Grupo incondicionalmente vivo' : muerta ? 'Marcada como muerta' : undefined}</title>
            </circle>
          )
        })
      )}

      {/* Ghost de la próxima jugada: previsualiza dónde y de qué color caería la piedra */}
      {mostrarGhost && miColor && hover && (
        <circle
          cx={coordenadas(hover.x)}
          cy={coordenadas(hover.y)}
          r={CELDA * 0.46}
          fill={RELLENO[miColor]}
          stroke="#1a1a1a"
          strokeWidth={miColor === NEGRO ? 0 : 1}
          opacity={0.4}
          pointerEvents="none"
        />
      )}
    </svg>
  )
}
