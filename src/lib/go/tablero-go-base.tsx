'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { BLANCO, NEGRO, VACIO, type Color, type Tablero } from './motor'

/**
 * Dibujo del tablero de Go: geometría/paleta, `PiedraIcono` (una piedrita suelta fuera del tablero,
 * ej. "Tu color: ⚫") y `TableroGoBase` — el único `<svg>` que arma la grilla/hoshi, el fondo con
 * sombra y las piedras (gradiente + sombra), y resuelve la matemática de click. Es el mismo tablero
 * tanto para la partida multijugador en vivo (`PartidaGo`, src/components/salas/go/partida-go.tsx)
 * como para el dojo de ejercicios (`DesafioDojoGo`, src/lib/go-dojo/components/desafio-dojo-go.tsx): cada uno solo
 * agrega, vía los slots de abajo, lo que le es propio (halo de turno, hint de territorio, ghost de
 * ayuda, marks, anillo de última jugada, etc.) — nunca vuelve a dibujar la grilla o las piedras por su
 * cuenta.
 */

export const CELDA_PX = 40
export const MARGEN_PX = 32

/** Posición en píxeles (dentro del viewBox) del índice de grilla `i`. */
export function coordenadaEnPixeles(i: number): number {
  return MARGEN_PX + i * CELDA_PX
}

/** Paleta de piedras y grilla del tablero. */
export const PALETA_GO_COMPARTIDA = {
  negro: '#1a1a1a',
  blanco: '#f5f5f5',
  contornoBlanco: '#1a1a1a',
  lineaGrilla: '#3f2d12',
  hoshi: '#3f2d12',
  tablero: '#FFE8B7',
} as const

/** Color de relleno "plano" de cada piedra (sin el gradiente/sombra del tablero real) — lo usan, por
 * ejemplo, indicadores de turno afuera del `<svg>` del tablero. */
export const RELLENO: Record<Color, string> = {
  [NEGRO]: PALETA_GO_COMPARTIDA.negro,
  [BLANCO]: PALETA_GO_COMPARTIDA.blanco,
}

/** Piedra blanca marcada como muerta: a la opacidad reducida, el casi-blanco de `RELLENO[BLANCO]` se
 * pierde contra el fondo claro, así que para ese caso puntual usamos un gris más oscuro. */
export const BLANCO_MUERTA = '#94a3b8'

/** Tonos del gradiente "brilloso" de cada piedra (luz a oscuridad), usados tanto por `TableroGoBase`
 * como por `PiedraIcono`, para que un mismo color se vea igual dentro y fuera del `<svg>` del tablero. */
export const TONOS_PIEDRA: Record<Color, [claro: string, oscuro: string]> = {
  [NEGRO]: ['#52525b', '#0a0a0a'],
  [BLANCO]: ['#ffffff', '#c4c4c8'],
}

/**
 * Piedrita chica (gradiente + sombra igual a las del tablero) para usar como ícono suelto fuera del
 * `<svg>` del tablero — ej. "Tu color: ⚫ Negro" o el indicador de turno. `className` controla el
 * tamaño (ej. `h-4 w-4`).
 */
export function PiedraIcono({ color, className }: { color: Color; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const gradienteId = `piedra-icono-${uid}`
  const filtroSombraId = `sombra-piedra-icono-${uid}`
  const [claro, oscuro] = TONOS_PIEDRA[color]

  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <defs>
        <filter id={filtroSombraId}>
          <feDropShadow dx="0" dy="0.6" stdDeviation="0.6" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <radialGradient id={gradienteId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={claro} />
          <stop offset="100%" stopColor={oscuro} />
        </radialGradient>
      </defs>
      <circle
        cx={10}
        cy={10}
        r={9}
        fill={`url(#${gradienteId})`}
        stroke="#1a1a1a"
        strokeWidth={color === NEGRO ? 0 : 0.7}
        filter={`url(#${filtroSombraId})`}
      />
    </svg>
  )
}

/** Puntos de referencia (hoshi) según el tamaño estándar del tablero, como [fila, columna]. */
function puntosHoshi(tamaño: number): Array<[number, number]> {
  if (tamaño === 9)
    return [
      [2, 2],
      [2, 6],
      [6, 2],
      [6, 6],
      [4, 4],
    ]
  if (tamaño === 13)
    return [
      [3, 3],
      [3, 9],
      [9, 3],
      [9, 9],
      [6, 6],
    ]
  if (tamaño === 19)
    return [
      [3, 3],
      [3, 9],
      [3, 15],
      [9, 3],
      [9, 9],
      [9, 15],
      [15, 3],
      [15, 9],
      [15, 15],
    ]
  return []
}

/**
 * Hook con la matemática de click del tablero: usa la matriz de transformación real del SVG
 * (`getScreenCTM`) en vez de calcular a mano el escalado del viewBox a partir de
 * `getBoundingClientRect`, así queda correcto incluso si el layout le da al elemento una caja no
 * cuadrada. Devuelve [fila, columna], o null si el click cayó fuera del tablero.
 */
function usePuntoDesdeEventoSvg(
  svgRef: React.RefObject<SVGSVGElement | null>,
  tamaño: number
): (e: React.MouseEvent<SVGSVGElement>) => [number, number] | null {
  return useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (!svg) return null
      const ctm = svg.getScreenCTM()
      if (!ctm) return null

      const puntoPantalla = svg.createSVGPoint()
      puntoPantalla.x = e.clientX
      puntoPantalla.y = e.clientY
      const { x: localX, y: localY } = puntoPantalla.matrixTransform(ctm.inverse())

      const columna = Math.round((localX - MARGEN_PX) / CELDA_PX)
      const fila = Math.round((localY - MARGEN_PX) / CELDA_PX)
      if (fila < 0 || fila >= tamaño || columna < 0 || columna >= tamaño) return null
      return [fila, columna]
    },
    [svgRef, tamaño]
  )
}

export interface EstadoPiedra {
  /** Opacidad de la piedra (ej. atenuarla al marcarla muerta durante la fase de conteo). Default 1. */
  opacidad?: number
  /** Filtro grayscale, para piedras incondicionalmente vivas (Benson) durante el conteo. */
  vivo?: boolean
  /** Override puntual del relleno (ej. gris sólido para una piedra blanca marcada muerta, en vez del gradiente normal). */
  fill?: string
  /** Tooltip nativo (`<title>`) de esa piedra. */
  titulo?: string
  /** Decoración dibujada encima de esa piedra puntual (ej. el triángulo de "jugada del estudiante"). */
  decoracion?: React.ReactNode
}

/** Lo que reciben los slots `beforeStones`/`afterStones` cuando se pasan como función. */
export interface ContextoTableroGo {
  hover: [fila: number, columna: number] | null
  /** El mismo relleno (gradiente) que usan las piedras reales del tablero, para que un ghost/preview
   * de una piedra suelta se vea igual que una piedra puesta. */
  piezaFill: (color: Color) => string
  filtroSombraUrl: string
  /** Ancho/alto del contenido del tablero (sin `glowMargen`), en las mismas unidades que `coordenadaEnPixeles`. */
  lado: number
}

type Slot = React.ReactNode | ((ctx: ContextoTableroGo) => React.ReactNode)

export interface TableroGoBaseProps {
  tablero: Tablero
  tamaño: number
  /** Margen extra en el viewBox, afuera del contenido, para halos que necesiten asomar sin que los
   * recorte el propio viewBox (ej. el glow de turno de PartidaGo). Default 0. */
  glowMargen?: number
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  onPointClick?: (fila: number, columna: number) => void
  /** Si una intersección es clickeable — controla el cursor y filtra los clicks. Default: solo puntos vacíos. */
  esSeleccionable?: (fila: number, columna: number) => boolean
  onHoverChange?: (punto: [number, number] | null) => void
  estadoPiedra?: (fila: number, columna: number, color: Color) => EstadoPiedra
  ariaLabel?: string
  /** `<defs>`/filtros adicionales que arma el caller (ej. los contornos de turno de PartidaGo), insertados apenas se abre el `<svg>`. */
  extraDefs?: React.ReactNode
  /** Dibujado antes del fondo del tablero (ej. el glow de turno, que va detrás de todo). */
  beforeBoard?: Slot
  /** Dibujado después de la grilla/hoshi pero antes de las piedras (ej. hint de territorio, resalte de grupo bajo el cursor durante el conteo). */
  beforeStones?: Slot
  /** Dibujado después de las piedras (ej. ghost de próxima jugada, marks, anillo de última jugada). */
  afterStones?: Slot
}

export function TableroGoBase({
  tablero,
  tamaño,
  glowMargen = 0,
  className,
  style,
  disabled = false,
  onPointClick,
  esSeleccionable,
  onHoverChange,
  estadoPiedra,
  ariaLabel,
  extraDefs,
  beforeBoard,
  beforeStones,
  afterStones,
}: TableroGoBaseProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const lado = CELDA_PX * (tamaño - 1) + MARGEN_PX * 2
  const viewBoxLado = lado + glowMargen * 2

  // Ids únicos por instancia para que gradientes/filtros no colisionen si hay más de un tablero
  // montado a la vez en la misma página.
  const idPiedras = useId().replace(/:/g, '')
  const gradienteNegroId = `piedra-negra-${idPiedras}`
  const gradienteBlancoId = `piedra-blanca-${idPiedras}`
  const filtroSombraId = `sombra-piedra-${idPiedras}`
  const filtroSombraUrl = `url(#${filtroSombraId})`
  const filtroSombraTableroId = `sombra-tablero-${idPiedras}`
  const filtroSombraTableroUrl = `url(#${filtroSombraTableroId})`

  const piezaFill = useCallback(
    (color: Color) => (color === NEGRO ? `url(#${gradienteNegroId})` : `url(#${gradienteBlancoId})`),
    [gradienteNegroId, gradienteBlancoId]
  )

  const puntoDesdeEvento = usePuntoDesdeEventoSvg(svgRef, tamaño)

  const puedeSeleccionar = useCallback(
    (fila: number, columna: number) =>
      esSeleccionable ? esSeleccionable(fila, columna) : tablero[fila][columna] === VACIO,
    [esSeleccionable, tablero]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !onPointClick) return
      const p = puntoDesdeEvento(e)
      if (!p) return
      const [fila, columna] = p
      if (!puedeSeleccionar(fila, columna)) return
      onPointClick(fila, columna)
    },
    [disabled, onPointClick, puntoDesdeEvento, puedeSeleccionar]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !onPointClick) {
        setHover(null)
        onHoverChange?.(null)
        return
      }
      const p = puntoDesdeEvento(e)
      setHover(p)
      onHoverChange?.(p)
    },
    [disabled, onPointClick, puntoDesdeEvento, onHoverChange]
  )

  const handleMouseLeave = useCallback(() => {
    setHover(null)
    onHoverChange?.(null)
  }, [onHoverChange])

  const cursor =
    disabled || !onPointClick || (hover && !puedeSeleccionar(hover[0], hover[1])) ? 'default' : 'pointer'

  const ctx: ContextoTableroGo = { hover, piezaFill, filtroSombraUrl, lado }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-glowMargen} ${-glowMargen} ${viewBoxLado} ${viewBoxLado}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={ariaLabel ?? 'Tablero de Go'}
      className={className}
      style={{ display: 'block', cursor, touchAction: 'none', ...style }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {extraDefs}

      <defs>
        {/* Sombra suave por fuera de cada piedra, apenas desplazada hacia abajo para dar sensación de
            volumen apoyado sobre el tablero. */}
        <filter id={filtroSombraId}>
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#000" floodOpacity="0.35" />
        </filter>
        {/* Sombra del tablero completo contra el fondo de la página, para que se note que "flota"
            apoyado en vez de quedar pegado como un recorte plano. */}
        <filter id={filtroSombraTableroId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
        </filter>
        {/* Luz viniendo de arriba a la izquierda (cx/cy corridos del centro): da el efecto de piedra
            pulida en vez de círculo plano. */}
        <radialGradient id={gradienteNegroId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={TONOS_PIEDRA[NEGRO][0]} />
          <stop offset="100%" stopColor={TONOS_PIEDRA[NEGRO][1]} />
        </radialGradient>
        <radialGradient id={gradienteBlancoId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={TONOS_PIEDRA[BLANCO][0]} />
          <stop offset="100%" stopColor={TONOS_PIEDRA[BLANCO][1]} />
        </radialGradient>
      </defs>

      {typeof beforeBoard === 'function' ? beforeBoard(ctx) : beforeBoard}

      <rect x={0} y={0} width={lado} height={lado} fill={PALETA_GO_COMPARTIDA.tablero} rx={8} filter={filtroSombraTableroUrl} />

      {Array.from({ length: tamaño }, (_, i) => (
        <line
          key={`h${i}`}
          x1={coordenadaEnPixeles(0)}
          y1={coordenadaEnPixeles(i)}
          x2={coordenadaEnPixeles(tamaño - 1)}
          y2={coordenadaEnPixeles(i)}
          stroke={PALETA_GO_COMPARTIDA.lineaGrilla}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: tamaño }, (_, i) => (
        <line
          key={`v${i}`}
          x1={coordenadaEnPixeles(i)}
          y1={coordenadaEnPixeles(0)}
          x2={coordenadaEnPixeles(i)}
          y2={coordenadaEnPixeles(tamaño - 1)}
          stroke={PALETA_GO_COMPARTIDA.lineaGrilla}
          strokeWidth={1}
        />
      ))}

      {puntosHoshi(tamaño).map(([fila, columna]) => (
        <circle key={`hoshi-${fila},${columna}`} cx={coordenadaEnPixeles(columna)} cy={coordenadaEnPixeles(fila)} r={3} fill={PALETA_GO_COMPARTIDA.hoshi} />
      ))}

      {typeof beforeStones === 'function' ? beforeStones(ctx) : beforeStones}

      <g filter={filtroSombraUrl}>
        {tablero.map((fila, y) =>
          fila.map((valor, x) => {
            if (valor === VACIO) return null
            const estado = estadoPiedra?.(y, x, valor) ?? {}
            return (
              <g key={`${y},${x}`}>
                <circle
                  cx={coordenadaEnPixeles(x)}
                  cy={coordenadaEnPixeles(y)}
                  r={CELDA_PX * 0.46}
                  fill={estado.fill ?? piezaFill(valor)}
                  stroke={PALETA_GO_COMPARTIDA.contornoBlanco}
                  strokeWidth={valor === NEGRO ? 0 : 1}
                  opacity={estado.opacidad ?? 1}
                  style={estado.vivo ? { filter: 'grayscale(1)' } : undefined}
                >
                  {estado.titulo && <title>{estado.titulo}</title>}
                </circle>
                {estado.decoracion}
              </g>
            )
          })
        )}
      </g>

      {typeof afterStones === 'function' ? afterStones(ctx) : afterStones}
    </svg>
  )
}
