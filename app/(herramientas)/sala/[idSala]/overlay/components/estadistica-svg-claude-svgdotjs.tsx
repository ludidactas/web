'use client'
import React, { useEffect, useRef, useState } from 'react'
import { SVG } from '@svgdotjs/svg.js'

// Tipos simulando tu estructura
interface Opcion {
  id: string
  texto: string
  votos: number
}

interface Encuesta {
  pregunta: string
  opciones: Opcion[]
}

interface EstadisticaSvgProps {
  data: Encuesta[]
}

// Componente principal mejorado
function EstadisticaSvg({ data }: EstadisticaSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgInstanceRef = useRef<any>(null)
  const barsRef = useRef<Map<string, any>>(new Map())
  const textsRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    if (!containerRef.current) return

    // Crear SVG solo la primera vez
    if (!svgInstanceRef.current) {
      svgInstanceRef.current = SVG().addTo(containerRef.current).size('100%', '100%').viewbox(0, 0, 800, 600)
    }

    const svg = svgInstanceRef.current

    // Renderizar cada encuesta
    data.forEach((encuesta, encuestaIdx) => {
      renderEncuesta(svg, encuesta, encuestaIdx)
    })

    // Cleanup al desmontar
    return () => {
      if (svgInstanceRef.current) {
        svgInstanceRef.current.remove()
        svgInstanceRef.current = null
        barsRef.current.clear()
        textsRef.current.clear()
      }
    }
  }, [data])

  const renderEncuesta = (svg: any, encuesta: Encuesta, encuestaIdx: number) => {
    const totalVotos = encuesta.opciones.reduce((sum, op) => sum + op.votos, 0)
    const maxVotos = Math.max(...encuesta.opciones.map((op) => op.votos))

    const yOffset = encuestaIdx * 200
    const maxBarWidth = 400
    const barHeight = 30
    const spacing = 40

    // Título de la encuesta (crear solo una vez)
    const titleKey = `title-${encuestaIdx}`
    if (!textsRef.current.has(titleKey)) {
      const title = svg
        .text(encuesta.pregunta)
        .move(20, yOffset + 10)
        .font({ size: 16, weight: 'bold' })
        .fill('#333')
      textsRef.current.set(titleKey, title)
    }

    encuesta.opciones.forEach((opcion, idx) => {
      const y = yOffset + 40 + idx * spacing
      const percentage = totalVotos > 0 ? (opcion.votos / totalVotos) * 100 : 0
      const barWidth = maxVotos > 0 ? (opcion.votos / maxVotos) * maxBarWidth : 0

      const bgBarKey = `bg-${opcion.id}`
      const progressBarKey = `progress-${opcion.id}`
      const labelKey = `label-${opcion.id}`
      const statsKey = `stats-${opcion.id}`

      // Crear elementos solo si no existen
      if (!barsRef.current.has(bgBarKey)) {
        // Fondo de la barra
        const bgBar = svg
          .rect(maxBarWidth, barHeight)
          .move(150, y)
          .fill('#f0f0f0')
          .stroke({ color: '#ddd', width: 1 })
          .radius(4)
        barsRef.current.set(bgBarKey, bgBar)

        // Barra de progreso (empezar desde 0)
        const progressBar = svg
          .rect(0, barHeight)
          .move(150, y)
          .fill(`hsl(${(idx * 60) % 360}, 70%, 50%)`)
          .radius(4)
        barsRef.current.set(progressBarKey, progressBar)

        // Etiqueta de la opción
        const label = svg
          .text(opcion.texto)
          .move(20, y + 8)
          .font({ size: 12 })
          .fill('#555')
        textsRef.current.set(labelKey, label)

        // Texto de estadísticas
        const statsText = svg
          .text('')
          .move(560, y + 8)
          .font({ size: 11 })
          .fill('#777')
        textsRef.current.set(statsKey, statsText)
      }

      // Actualizar la barra animando desde su ancho actual
      const progressBar = barsRef.current.get(progressBarKey)
      if (progressBar) {
        progressBar.animate(600, 0, 'now').ease('<>').attr({ width: barWidth })
      }

      // Actualizar texto de estadísticas
      const statsText = textsRef.current.get(statsKey)
      if (statsText) {
        const newStatsText = `${percentage.toFixed(1)}% (${opcion.votos})`
        statsText.text(newStatsText)
      }
    })
  }

  return <div ref={containerRef} className="w-full h-full min-h-[400px] border border-gray-200 rounded-lg bg-white" />
}

// Componente de ejemplo con datos de prueba
export default function TestEstadisticaApp() {
  const [data, setData] = useState<Encuesta[]>([
    {
      pregunta: '¿Cuál es tu lenguaje de programación favorito?',
      opciones: [
        { id: '1', texto: 'JavaScript', votos: 45 },
        { id: '2', texto: 'Python', votos: 32 },
        { id: '3', texto: 'TypeScript', votos: 28 },
        { id: '4', texto: 'Go', votos: 15 },
      ],
    },
    {
      pregunta: '¿Qué framework prefieres para frontend?',
      opciones: [
        { id: '5', texto: 'React', votos: 50 },
        { id: '6', texto: 'Vue', votos: 25 },
        { id: '7', texto: 'Angular', votos: 18 },
        { id: '8', texto: 'Svelte', votos: 12 },
      ],
    },
  ])

  // Función para simular cambios en los datos
  const updateData = () => {
    setData((prev) =>
      prev.map((encuesta) => ({
        ...encuesta,
        opciones: encuesta.opciones.map((opcion) => ({
          ...opcion,
          votos: Math.floor(Math.random() * 60) + 5,
        })),
      }))
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Estadísticas de Encuestas</h1>

      <div className="mb-4">
        <button
          onClick={updateData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Actualizar Datos
        </button>
      </div>

      <EstadisticaSvg data={data} />

      <div className="mt-4 text-sm text-gray-600">
        <p>Haz clic en "Actualizar Datos" para ver las animaciones en acción.</p>
        <p>Las barras se animan suavemente cuando cambian los datos.</p>
      </div>
    </div>
  )
}
