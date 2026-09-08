import { useId } from 'react'

interface FiltroOutlineOptions {
  outlineColor?: string
  radius?: number
}

/**
 * Base del efecto de contorno: genera el `<filter>` de SVG y devuelve su id/url, sin asumir ningún
 * wrapper. Sirve para aplicarlo con el atributo `filter="url(#id)"` directo sobre un elemento SVG
 * nativo (`<g>`, `<circle>`, `<path>`...) o, vía CSS (`style={{filter: filterUrl}}`), sobre HTML.
 */
export function useOutlineFilter({ outlineColor = 'black', radius = 3 }: FiltroOutlineOptions = {}) {
  const uid = useId().replace(/:/g, '')
  const filterId = `outlined-${uid}`
  const filterUrl = `url(#${filterId})`

  const defs = (
    <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        {/* Región bien holgada: para un elemento chico (ej. una sola piedra), un margen del 10%
            son apenas ~3px — casi lo mismo que `radius`, y cualquier redondeo lo recorta justo
            en el borde. Con esto sobra margen para cualquier tamaño realista de contenido. */}
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feMorphology operator="dilate" radius={radius} in="SourceAlpha" result="expanded" />
          <feFlood floodColor={outlineColor} result="color" />
          <feComposite in="color" in2="expanded" operator="in" result="coloredOutline" />
          <feMerge>
            <feMergeNode in="coloredOutline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )

  return { filterId, filterUrl, defs }
}

interface OutlinedProps extends FiltroOutlineOptions {
  children: React.ReactNode
  className?: string
}

/** Contorno para contenido HTML: envuelve `children` en un `<span>` filtrado. */
export function Outlined({ outlineColor, radius, children, className }: OutlinedProps) {
  const { filterUrl, defs } = useOutlineFilter({ outlineColor, radius })

  return (
    <>
      {defs}
      <span className={className} style={{ filter: filterUrl }}>
        {children}
      </span>
    </>
  )
}

interface OutlinedEnForeignObjectProps extends OutlinedProps {
  x: number
  y: number
  width: number
  height: number
}

/**
 * `Outlined` para usar dentro de un `<svg>`: agrega el `<foreignObject>` + `<div>` centrado que hace
 * falta para poder meter el `<span>` de `Outlined` ahí adentro.
 */
export function OutlinedEnForeignObject({
  x,
  y,
  width,
  height,
  outlineColor,
  radius,
  className,
  children,
}: OutlinedEnForeignObjectProps) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <Outlined outlineColor={outlineColor} radius={radius} className={className}>
          {children}
        </Outlined>
      </div>
    </foreignObject>
  )
}

/**
 * Un SVG invisible que se inserta en el DOM donde se quiera que esté disponible.
 * Se usa mediante CSS con `filter: url(#blurcito)`, `filter: url(#noisy)`, etc...
 */
export function FiltrosSvg() {
  return (
    <>
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          {/* Básico */}
          <filter id="blurcito">
            <feGaussianBlur stdDeviation="1" />
          </filter>

          {/* Animado */}
          {/* x/y/width/height amplían el área del filtro para que el warp no se clipee en los bordes */}
          <filter id="warpy" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="1" result="noise">
              <animate attributeName="baseFrequency" values="0.015;0.03;0.015" dur="8s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Color se controla con la prop CSS `color` del elemento que aplica el filtro.
              Región holgada (ver comentario en useOutlineFilter) para que no se recorte en elementos chicos. */}
          <filter id="outlined" x="-40%" y="-40%" width="180%" height="180%">
            <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="expanded" />
            <feFlood floodColor="currentColor" result="color" />
            <feComposite in="color" in2="expanded" operator="in" result="coloredOutline" />
            <feMerge>
              <feMergeNode in="coloredOutline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Separación RGB + jitter horizontal — imita señal digital corrompida */}
          <filter id="glitch" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="turbulence" baseFrequency="0.05 0.8" numOctaves="1" seed="5" result="noise">
              <animate attributeName="seed" values="5;12;3;18;7;5" dur="0.4s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feOffset in="displaced" dx="4" dy="0" result="r-shift" />
            <feColorMatrix
              in="r-shift"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="r-only"
            />
            <feColorMatrix
              in="displaced"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="g-only"
            />
            <feOffset in="displaced" dx="-4" dy="0" result="b-shift" />
            <feColorMatrix
              in="b-shift"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="b-only"
            />
            <feBlend in="r-only" in2="g-only" mode="screen" result="rg" />
            <feBlend in="rg" in2="b-only" mode="screen" />
          </filter>
        </defs>
      </svg>

      <style>{`
        .blurcito { filter: url(#blurcito); }
        .warpy { filter: url(#warpy); }
        .hover-outlined { filter: url(#outlined); }
        .glitch { filter: url(#glitch); }
        .hover-glitch:hover { filter: url(#glitch); }
      `}</style>
    </>
  )
}
