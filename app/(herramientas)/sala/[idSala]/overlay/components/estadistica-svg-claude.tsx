'use client'
import React, { useState, useEffect, ReactNode } from 'react'
import { useEncuestaEstudiante } from '../../../components/encuestas-estudiante-context'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'
import { Encuesta, Opcion } from '@/wss/tipos'
import { EstadisticaSvgConfig } from '../page'
import { motion } from 'framer-motion'

export default function EstadisticaLiveSvg({ config }: { config: EstadisticaSvgConfig }) {
  // Agarramos la encuesta del server, accediendo a la sala como si fueramos estudiante
  const { estado, encuestas, error } = useEncuestaEstudiante()
  const encuesta = encuestas.find((e) => e.isFocused) || encuestas[0]

  return (
    <div className="min-w-[100vw]">
      {estado !== StatusDeConexion.Conectado && <p>Conectando...</p>}
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
function EncuestaSVG({ encuesta, config }: { encuesta: Encuesta; config: EstadisticaSvgConfig }) {
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

  const ops = encuesta.opciones.toSorted((a, b) => b.votos - a.votos)

  const { bg, barHeight, barSpacing, titleHeight } = config

  // Calcular dimensiones
  const svgHeight = titleHeight + encuesta.opciones.length * barSpacing + 20

  return (
    <div className="m-20 w-auto rounded-xl p-6" style={{ backgroundColor: bg }}>
      <svg className="w-full" viewBox={`0 0 800 ${svgHeight}`} style={{ height: 'auto' }}>
        {/* Título de la encuesta */}
        <text
          x="400"
          y="25"
          textAnchor="middle"
          className="text-lg font-semibold fill-white"
          style={{ fontSize: '18px', fontWeight: 'bold' }}
        >
          {encuesta.pregunta}
        </text>

        {/* Barras */}
        {ops.map((op) => (
          <motion.g
            key={op.id}
            initial={false}
            animate={{
              transform: `translate(0, ${titleHeight + ops.indexOf(op) * barSpacing}px)`,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }} // or use ease: "easeInOut"
            // transform={`translate(0, ${titleHeight + ops.indexOf(op) * barSpacing})`}
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
  opcion: Opcion
  percentage: number
  maxPercentage?: number
  barHeight: number
  barColor: string
  className?: string
  children?: ReactNode
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)

  const p = maxPercentage ? (percentage / maxPercentage) : percentage

  // Calcular dimensiones
  const maxBarWidth = 400
  const targetWidth = p > 0 ? (p) * maxBarWidth : 0
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
      <text
        x="140"
        y={barHeight / 2}
        textAnchor="end"
        dominantBaseline="middle"
        className="fill-white"
        style={{
          fontSize: '14px',
          fontWeight: '500',
          transition: 'font-weight 0.2s ease',
        }}
      >
        {opcion.texto}
      </text>

      {/* Valor y porcentaje */}
      <text
        x={150 + maxBarWidth + 15}
        y={barHeight / 2 - 6}
        dominantBaseline="middle"
        className="fill-emerald-500"
        style={{ fontSize: '12px', fontWeight: '600' }}
      >
        {opcion.votos} votos
      </text>

      <text
        x={150 + maxBarWidth + 15}
        y={barHeight / 2 + 8}
        dominantBaseline="middle"
        className="fill-white"
        style={{ fontSize: '11px' }}
      >
        {percentage100s.toFixed(1)}%
      </text>

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

// Componente de ejemplo con datos de prueba
export function TestApp() {
  const [data, setData] = useState<Partial<Encuesta>[]>([
    {
      pregunta: '¿Cuál es tu lenguaje de programación favorito?',
      opciones: [
        { id: '1', texto: 'JavaScript', votos: 45 },
        { id: '2', texto: 'Python', votos: 32 },
        { id: '3', texto: 'TypeScript', votos: 28 },
        { id: '4', texto: 'Go', votos: 15 },
        { id: '5', texto: 'Rust', votos: 8 },
      ],
    },
    {
      pregunta: '¿Qué framework prefieres para frontend?',
      opciones: [
        { id: '6', texto: 'React', votos: 50 },
        { id: '7', texto: 'Vue.js', votos: 25 },
        { id: '8', texto: 'Angular', votos: 18 },
        { id: '9', texto: 'Svelte', votos: 12 },
      ],
    },
  ])

  // Función para simular cambios en los datos
  const updateData = () => {
    setData((prev) =>
      prev.map((encuesta) => ({
        ...encuesta,
        opciones: encuesta.opciones!.map((opcion) => ({
          ...opcion,
          votos: Math.floor(Math.random() * 60) + 5,
        })),
      }))
    )
  }

  const resetData = () => {
    setData([
      {
        pregunta: '¿Cuál es tu lenguaje de programación favorito?',
        opciones: [
          { id: '1', texto: 'JavaScript', votos: 45 },
          { id: '2', texto: 'Python', votos: 32 },
          { id: '3', texto: 'TypeScript', votos: 28 },
          { id: '4', texto: 'Go', votos: 15 },
          { id: '5', texto: 'Rust', votos: 8 },
        ],
      },
      {
        pregunta: '¿Qué framework prefieres para frontend?',
        opciones: [
          { id: '6', texto: 'React', votos: 50 },
          { id: '7', texto: 'Vue.js', votos: 25 },
          { id: '8', texto: 'Angular', votos: 18 },
          { id: '9', texto: 'Svelte', votos: 12 },
        ],
      },
    ])
  }

  return (
    <div className="min-h-screen min-w-[100vw] py-8">
      <div className="px-6">
        <div className="text-center mb-8">
          <div className="flex justify-center space-x-4">
            <button
              onClick={updateData}
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              🔄 Actualizar Datos
            </button>
            <button
              onClick={resetData}
              className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              ↩️ Resetear
            </button>
          </div>
        </div>

        {/* <EstadisticaSvg data={data as Encuesta[]} /> */}
      </div>
    </div>
  )
}
