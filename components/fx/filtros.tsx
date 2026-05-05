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

          {/* Color se controla con la prop CSS `color` del elemento que aplica el filtro */}
          <filter id="outlined" x="-10%" y="-10%" width="120%" height="120%">
            <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="expanded" />
            <feFlood floodColor="currentColor" result="color" />
            <feComposite in="color" in2="expanded" operator="in" result="coloredOutline" />
            <feMerge>
              <feMergeNode in="coloredOutline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <style>{`
        .blurcito { filter: url(#blurcito); }
        .warpy { filter: url(#warpy); }
        .outlined { filter: url(#outlined); }
      `}</style>
    </>
  )
}
