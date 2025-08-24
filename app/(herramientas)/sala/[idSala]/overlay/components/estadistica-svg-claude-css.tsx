'use client'
import React, { useState } from 'react'

// Tipos para nuestros datos
interface Opcion {
  id: string
  texto: string
  votos: number
}

interface Encuesta {
  pregunta: string
  opciones: Opcion[]
}

interface EstadisticaCSSProps {
  data: Encuesta[]
}

// Componente principal con React + CSS
function EstadisticaCSS({ data }: EstadisticaCSSProps) {
  return (
    <div className="space-y-8">
      {data.map((encuesta, encuestaIdx) => (
        <EncuestaChart key={encuestaIdx} encuesta={encuesta} />
      ))}
    </div>
  )
}

// Componente para una encuesta individual
function EncuestaChart({ encuesta }: { encuesta: Encuesta }) {
  const maxVotos = Math.max(...encuesta.opciones.map((op) => op.votos))
  const totalVotos = encuesta.opciones.reduce((sum, op) => sum + op.votos, 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">{encuesta.pregunta}</h3>

      <div className="space-y-4">
        {encuesta.opciones.map((opcion, idx) => (
          <BarraAnimada key={opcion.id} opcion={opcion} maxVotos={maxVotos} totalVotos={totalVotos} colorIndex={idx} />
        ))}
      </div>

      {/* Resumen */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Total de votos: <span className="font-semibold">{totalVotos}</span>
        </p>
      </div>
    </div>
  )
}

// Componente para una barra individual
function BarraAnimada({
  opcion,
  maxVotos,
  totalVotos,
  colorIndex,
}: {
  opcion: Opcion
  maxVotos: number
  totalVotos: number
  colorIndex: number
}) {
  const percentage = totalVotos > 0 ? (opcion.votos / totalVotos) * 100 : 0
  const widthPercentage = maxVotos > 0 ? (opcion.votos / maxVotos) * 100 : 0

  // Colores más suaves y modernos
  const getColor = (index: number) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-yellow-400 to-yellow-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-teal-400 to-teal-600',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="group">
      {/* Etiqueta y estadísticas */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 truncate pr-2">{opcion.texto}</span>
        <div className="flex items-center space-x-3 text-sm text-gray-600 shrink-0">
          <span className="font-semibold">{percentage.toFixed(1)}%</span>
          <span className="text-gray-500">{opcion.votos} votos</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="relative">
        {/* Fondo de la barra */}
        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden shadow-inner">
          {/* Barra de progreso animada */}
          <div
            className={`h-full bg-gradient-to-r ${getColor(
              colorIndex
            )} rounded-full transition-all duration-700 ease-out relative overflow-hidden group-hover:shadow-lg`}
            style={{
              width: `${widthPercentage}%`,
              transitionProperty: 'width, box-shadow',
            }}
          >
            {/* Brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-pulse"></div>

            {/* Texto interno (solo si hay espacio) */}
            {widthPercentage > 15 && (
              <div className="absolute right-2 top-0 h-full flex items-center">
                <span className="text-xs font-semibold text-white drop-shadow-sm">{opcion.votos}</span>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de hover */}
        <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          {opcion.texto}: {opcion.votos} votos ({percentage.toFixed(1)}%)
        </div>
      </div>
    </div>
  )
}

// Componente de ejemplo con datos de prueba
export default function App() {
  const [data, setData] = useState<Encuesta[]>([
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
    {
      pregunta: '¿Cuál es tu base de datos preferida?',
      opciones: [
        { id: '10', texto: 'PostgreSQL', votos: 35 },
        { id: '11', texto: 'MongoDB', votos: 28 },
        { id: '12', texto: 'MySQL', votos: 22 },
        { id: '13', texto: 'SQLite', votos: 8 },
        { id: '14', texto: 'Redis', votos: 5 },
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
      {
        pregunta: '¿Cuál es tu base de datos preferida?',
        opciones: [
          { id: '10', texto: 'PostgreSQL', votos: 35 },
          { id: '11', texto: 'MongoDB', votos: 28 },
          { id: '12', texto: 'MySQL', votos: 22 },
          { id: '13', texto: 'SQLite', votos: 8 },
          { id: '14', texto: 'Redis', votos: 5 },
        ],
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Estadísticas de Encuestas</h1>
          <p className="text-gray-600 mb-6">Gráficos animados con React + CSS puro</p>

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

        <EstadisticaCSS data={data} />

      </div>
    </div>
  )
}
