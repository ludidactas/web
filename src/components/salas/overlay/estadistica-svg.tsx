'use client'
import { EncuestaConVotos, OpcionConVotos } from '@/wss/validators/polls'
import { motion } from 'framer-motion'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { isNullish } from 'remeda'
import { EstadisticaSvgConfig } from './estadistica-svg-config'

function useScrambleText(targetText: string) {
  const [displayText, setDisplayText] = useState(targetText)
  const prevRef = useRef(targetText)

  useEffect(() => {
    if (prevRef.current === targetText) return
    prevRef.current = targetText

    const CHARS = '?!#@%ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789'
    const STEPS = 18
    const INTERVAL_MS = 45
    let step = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      step++
      const settled = Math.floor((step / STEPS) * targetText.length)
      setDisplayText(
        targetText
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '
            if (i < settled) return char
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          })
          .join('')
      )
      if (step < STEPS) {
        timer = setTimeout(tick, INTERVAL_MS)
      } else {
        setDisplayText(targetText)
      }
    }

    timer = setTimeout(tick, INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [targetText])

  return displayText
}

import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { useConexionOverlay } from '@/wss-cli/providers/wss-overlay-context'
import { overlayEncuestaStore } from '@/wss-cli/stores/overlay-encuestas-store'
import { Icon } from '@iconify/react/dist/iconify.js'
import LoadingSala from '../loading-sala'

export default function EstadisticaLiveSvg({ config }: { config: EstadisticaSvgConfig }) {
  // Agarramos la encuesta del server, accediendo a la sala como si fueramos estudiante
  const { estado, error } = useConexionOverlay()
  const { encuesta } = overlayEncuestaStore()

  return (
    <div className="w-full">
      {estado !== StatusDeConexion.Conectado && <LoadingSala />}
      {error && <p className="text-red-500">Error: {error}</p>}
      {estado === StatusDeConexion.Conectado && (
        <>
          {encuesta && <EncuestaSVG encuesta={encuesta} config={config} />}
          {!encuesta && (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">No hay datos de encuestas disponibles.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Componente para una encuesta individual
export function EncuestaSVG({ encuesta, config }: { encuesta: EncuestaConVotos; config: EstadisticaSvgConfig }) {
  if (isNullish(encuesta)) {
    return (
      <div className="bg-white w-full rounded-xl">
        <p className="text-center text-slate-400 p-4">No hay encuestas enfocadas</p>
      </div>
    )
  }
  const maxVotos = Math.max(...encuesta.opciones.map((op) => op.votos))
  const totalVotos = encuesta.opciones.reduce((sum, op) => sum + op.votos, 0)

  // Colores
  const colores = [
    'rgb(59, 130, 246)', // blue-500
    'rgb(16, 185, 129)', // emerald-500
    'rgb(168, 85, 247)', // purple-500
    'rgb(245, 101, 101)', // red-400
    'rgb(251, 191, 36)', // amber-400
    'rgb(14, 165, 233)', // sky-500
    'rgb(236, 72, 153)', // pink-500
    'rgb(34, 197, 94)', // green-500
  ]

  const ids = encuesta.opciones.map((op) => op.id)

  const ops = encuesta.opciones
    .toSorted((a, b) => b.votos - a.votos)
    .map((opc) => ({ ...opc, texto: encuesta.isRevealed ? opc.texto : '?????' }))

  const { bg, barHeight, barSpacing, titleHeight, margin } = config

  // Calcular dimensiones
  const svgHeight = titleHeight + encuesta.opciones.length * barSpacing + 20

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
              transform: `translate(0, ${titleHeight + ops.indexOf(op) * barSpacing}px)`,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }} // or use ease: "easeInOut"
          >
            <BarraEstadistica
              percentage={totalVotos > 0 ? op.votos / totalVotos : 0}
              maxPercentage={maxVotos > 0 ? maxVotos / totalVotos : 0}
              barColor={colores[ids.indexOf(op.id) % colores.length]}
              opcion={op}
              barHeight={barHeight}
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
}: {
  opcion: OpcionConVotos
  percentage: number
  maxPercentage?: number
  barHeight: number
  barColor: string
  className?: string
  children?: ReactNode
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const scrambledText = useScrambleText(opcion.texto)

  const p = maxPercentage ? percentage / maxPercentage : percentage

  // Calcular dimensiones: etiqueta 0-150, barra 150-900, texto 915+
  const maxBarWidth = 750
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
        x="150"
        y="0"
        width={animatedWidth}
        height={barHeight}
        fill={barColor}
        rx="8"
        style={{
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: isHovered ? 'brightness(1.1)' : 'none',
          transformOrigin: 'left center',
        }}
      />

      {/* Efecto de brillo en hover */}
      {isHovered && (
        <rect
          x="150"
          y="0"
          width={animatedWidth}
          height={barHeight}
          fill="url(#shimmer)"
          rx="8"
          style={{ opacity: 0.3 }}
        />
      )}

      {/* Etiqueta del texto */}
      <foreignObject x="0" y="0" width="140" height={barHeight}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              color: 'white',
              fontSize: opcion.texto.length > 18 ? '11px' : '14px',
              fontWeight: '500',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              width: '100%',
            }}
          >
            {scrambledText}
          </div>
        </div>
      </foreignObject>

      {/* Valor y porcentaje */}
      <foreignObject x={150 + maxBarWidth + 15} y={0} width="85" height={barHeight}>
        <div className="flex items-center gap-4 " style={{ width: '100%', height: '100%' }}>
          <span className="text-white text-xl">{percentage100s.toFixed(0)}%</span>
          <span className="flex items-center gap-1 font-bold text-2xl text-emerald-400">
            {opcion.votos} <Icon icon={'pepicons-pop:hand-point'} />
          </span>
        </div>
      </foreignObject>

      {/* Gradientes para efectos */}
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
    </g>
  )
}
