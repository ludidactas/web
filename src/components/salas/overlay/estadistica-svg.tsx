'use client'
import { Outlined } from '@/components/fx/filtros'
import useScrambleText from '@/components/hooks/use-scramble-text'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { useConexionOverlay } from '@/wss-cli/providers/wss-overlay-context'
import { overlayEncuestaStore } from '@/wss-cli/stores/overlay-encuestas-store'
import { EncuestaConVotos, OpcionConVotos } from '@/wss/validators/polls'
import { Icon } from '@iconify/react/dist/iconify.js'
import { motion } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'
import { isNullish } from 'remeda'
import { EstadisticaSvgConfig } from './estadistica-svg-config'

// Alto reservado para la etiqueta del texto, que va siempre encima de la barra.
const ALTO_ETIQUETA = 28

// Layout horizontal del SVG (viewBox de 1000 de ancho).
const ANCHO_SVG = 1000
const FIN_BARRA = 810 // x donde la barra llega al 100%
const X_VALOR = FIN_BARRA + 12 // inicio de la caja de votos/porcentaje
const ANCHO_VALOR = ANCHO_SVG - X_VALOR // el resto del ancho, para que la manito no se clipee
const ALTO_MIN_VALOR = 44 // alto mínimo de la caja de valor: evita que el %/manito (text-3xl) se clipeen con barHeight chico

export default function EstadisticaLiveSvg({ config }: { config: EstadisticaSvgConfig }) {
  // Agarramos la encuesta del server, accediendo a la sala como si fueramos estudiante
  const { estado, error } = useConexionOverlay()
  const { encuesta } = overlayEncuestaStore()

  return (
    <div className="w-full">
      {error && <p className="text-red-500">Error: {error}</p>}
      {estado === StatusDeConexion.Conectado && encuesta && <EncuestaSVG encuesta={encuesta} config={config} />}
    </div>
  )
}

// Componente para una encuesta individual
export function EncuestaSVG({ encuesta, config }: { encuesta: EncuestaConVotos; config: EstadisticaSvgConfig }) {
  if (isNullish(encuesta)) {
    return (
      <div className="bg-transparent w-full rounded-xl">
        <p className="text-center text-slate-400 p-4">No hay encuestas enfocadas</p>
      </div>
    )
  }
  const maxVotos = Math.max(...encuesta.opciones.map((op) => op.votos))
  const totalVotos = encuesta.opciones.reduce((sum, op) => sum + op.votos, 0)

  const ids = encuesta.opciones.map((op) => op.id)

  const ops = encuesta.opciones
    .toSorted((a, b) => b.votos - a.votos)
    .map((opc) => ({ ...opc, texto: encuesta.isRevealed ? opc.texto : '?????' }))

  // Renombramos los que cambiaron a castellano en zod a su antiguo nombre original en inglés
  const {
    fondo: bg,
    altoBarra: barHeight,
    espacioBarras: barSpacing,
    altoTitulo: titleHeight,
    margen: margin,
    radioBarra: barRadius,
    colores,
    colorValor,
    colorValorAlterno: colorValorAlt,
  } = config

  // Cada fila = etiqueta (arriba) + barra; el paso vertical suma el gap (barSpacing), así el
  // espacio entre barras se mantiene constante aunque crezca barHeight.
  const pasoVertical = ALTO_ETIQUETA + barHeight + barSpacing

  // Calcular dimensiones
  const svgHeight = titleHeight + encuesta.opciones.length * pasoVertical + 20

  // El título no entra en una sola línea fija: encogemos la fuente y permitimos más
  // líneas según el largo del texto, dejando que el foreignObject haga el wrap/elipsis.
  const largoPregunta = encuesta.pregunta.length
  const { fontSize: tituloFontSize, lineas: tituloLineas } =
    largoPregunta > 140
      ? { fontSize: 16, lineas: 3 }
      : largoPregunta > 80
      ? { fontSize: 20, lineas: 2 }
      : largoPregunta > 40
      ? { fontSize: 24, lineas: 2 }
      : { fontSize: 28, lineas: 2 }

  return (
    <div className="w-auto rounded-xl p-6" style={{ backgroundColor: bg, margin: `${margin}px` }}>
      <svg className="w-full" viewBox={`0 0 1000 ${svgHeight}`}>
        {/* Gradiente para el brillo en hover -- declarado una sola vez para todas las barras */}
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Título de la encuesta */}
        <foreignObject x="20" y="0" width="960" height={titleHeight}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                color: 'white',
                fontSize: `${tituloFontSize}px`,
                fontWeight: 'bold',
                lineHeight: 1.2,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: tituloLineas,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                width: '100%',
              }}
            >
              {encuesta.pregunta}
            </div>
          </div>
        </foreignObject>

        {/* Barras */}
        {ops.map((op) => (
          <motion.g
            key={op.id}
            initial={false}
            animate={{
              transform: `translate(0, ${titleHeight + 20 + ops.indexOf(op) * pasoVertical}px)`,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }} // or use ease: "easeInOut"
          >
            <BarraEstadistica
              percentage={totalVotos > 0 ? op.votos / totalVotos : 0}
              maxPercentage={maxVotos > 0 ? maxVotos / totalVotos : 0}
              barColor={colores[ids.indexOf(op.id) % colores.length]}
              opcion={op}
              barHeight={barHeight}
              barRadius={barRadius}
              colorValor={colorValor}
              colorValorAlt={colorValorAlt}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

// Componente individual de barra
function BarraEstadistica({
  opcion,
  barHeight,
  percentage,
  maxPercentage,
  barColor,
  barRadius,
  colorValor,
  colorValorAlt,
}: {
  opcion: OpcionConVotos
  percentage: number
  maxPercentage?: number
  barHeight: number
  barColor: string
  barRadius: number
  colorValor: string
  colorValorAlt: string
  className?: string
  children?: ReactNode
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const scrambledText = useScrambleText(opcion.texto)

  const p = maxPercentage ? percentage / maxPercentage : percentage

  // Geometría: etiqueta (fila superior, ancho completo) | barra 0-FIN_BARRA debajo | valor X_VALOR+
  const barY = ALTO_ETIQUETA
  const maxBarWidth = FIN_BARRA

  // La caja del valor (%/manito) tiene alto propio (no atado a barHeight) y va centrada sobre la barra,
  // así no se clipea aunque barHeight sea chico.
  const altoValor = Math.max(barHeight, ALTO_MIN_VALOR)
  const yValor = barY + (barHeight - altoValor) / 2

  const targetWidth = p > 0 ? p * maxBarWidth : 0
  const percentage100s = percentage * 100

  // Animación de la barra
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(targetWidth)
    }, 100) // Delay escalonado

    return () => clearTimeout(timer)
  }, [targetWidth])

  // Estado de hover
  const [isHovered, setIsHovered] = useState(false)

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ cursor: 'pointer' }}>
      {/* Barra de progreso animada */}
      <rect
        x={0}
        y={barY}
        width={animatedWidth}
        height={barHeight}
        fill={barColor}
        rx={barRadius}
        style={{
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: isHovered ? 'brightness(1.1)' : 'none',
          transformOrigin: 'left center',
        }}
      />

      {/* Efecto de brillo en hover */}
      {isHovered && (
        <rect
          x={0}
          y={barY}
          width={animatedWidth}
          height={barHeight}
          fill="url(#shimmer)"
          rx={barRadius}
          style={{ opacity: 0.3 }}
        />
      )}

      {/* Etiqueta del texto de la respuesta -- fila superior, ancho completo */}
      <foreignObject x={0} y={0} width={FIN_BARRA} height={ALTO_ETIQUETA}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              width: '100%',
            }}
          >
            {scrambledText}
          </div>
        </div>
      </foreignObject>

      {/* Valor y porcentaje -- a la derecha de la barra (que siempre termina en FIN_BARRA) */}
      <foreignObject x={X_VALOR} y={yValor} width={ANCHO_VALOR} height={altoValor}>
        <div className="flex items-center gap-8 pr-1" style={{ width: '100%', height: '100%' }}>
          {/* Ancho fijo + alineado a derecha: la columna de votos arranca en la misma x en toda fila */}
          <Outlined outlineColor={colorValorAlt} radius={3} className="flex items-center gap-1 text-3xl font-bold ">
            <span className="w-14 shrink-0 text-right text-xl" style={{ color: colorValor }}>
              {percentage100s.toFixed(0)}%
            </span>
          </Outlined>
          <Outlined
            outlineColor={colorValor}
            radius={3}
            className="flex -rotate-6 items-center gap-1 text-3xl font-bold "
          >
            <span className="flex items-center gap-1" style={{ color: colorValorAlt }}>
              {opcion.votos} <Icon icon={'pepicons-pop:hand-point'} />
            </span>
          </Outlined>
        </div>
      </foreignObject>
    </g>
  )
}
